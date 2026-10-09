import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";
import { extractText } from "@/lib/extraction";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a stream buffer to Cloudinary
 */
function uploadToCloudinary(buffer: Buffer, originalName: string, mimeType: string): Promise<{ secure_url: string }> {
  return new Promise((resolve, reject) => {
    // We determine resource type based on mime
    const resourceType = mimeType.startsWith("image/") ? "image" : "raw";
    
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        folder: "quizora",
        // Using originalName directly has sanitization issues in cloudinary, but we can supply public_id
      },
      (error, result) => {
        if (error || !result) return reject(error);
        resolve(result);
      }
    );

    uploadStream.end(buffer);
  });
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Read the file as a Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Extract Text First
    let extractedText = "";
    let extractionWarning = "";

    try {
      const extractionResult = await extractText(buffer, file.type, file.name);
      extractedText = extractionResult.text;
      if (extractionResult.warning) {
        extractionWarning = extractionResult.warning;
      }
    } catch (extractError: any) {
      console.error("Extraction error:", extractError);
      return NextResponse.json(
        { error: extractError.message || "Failed to extract text from file" },
        { status: 422 }
      );
    }

    // 2. Upload to Cloudinary
    let fileUrl = "";
    try {
      // If Cloudinary env vars are missing, we bypass upload in local development
      if (!process.env.CLOUDINARY_CLOUD_NAME) {
        console.warn("Cloudinary not configured, returning fake URL for development");
        fileUrl = `https://mock.url/${encodeURIComponent(file.name)}`;
      } else {
        const uploadResult = await uploadToCloudinary(buffer, file.name, file.type);
        fileUrl = uploadResult.secure_url;
      }
    } catch (uploadError: any) {
      console.error("Cloudinary upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file to storage" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      fileUrl,
      fileName: file.name,
      fileType: file.type,
      extractedText,
      warning: extractionWarning || undefined,
    });
  } catch (error: any) {
    console.error("Upload API Error:", error);
    return NextResponse.json(
      { error: "Internal server error during upload" },
      { status: 500 }
    );
  }
}
