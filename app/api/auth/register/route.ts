import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const teacherSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  institution: z.string().optional(),
  designation: z.string().optional(),
  password: z.string().min(8),
  role: z.literal("TEACHER"),
});

const studentSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  rollNumber: z.string().min(1),
  department: z.string().optional(),
  year: z.string().optional(),
  className: z.string().optional(),
  password: z.string().min(8),
  role: z.literal("STUDENT"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: body.email },
    });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(body.password, 12);

    if (body.role === "TEACHER") {
      const parsed = teacherSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid registration data." },
          { status: 400 }
        );
      }

      const user = await prisma.user.create({
        data: {
          name: parsed.data.name,
          email: parsed.data.email,
          passwordHash,
          role: "TEACHER",
          teacherProfile: {
            create: {
              institution: parsed.data.institution,
              designation: parsed.data.designation,
            },
          },
        },
      });

      return NextResponse.json({ id: user.id }, { status: 201 });
    }

    if (body.role === "STUDENT") {
      const parsed = studentSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid registration data." },
          { status: 400 }
        );
      }

      // Check roll number uniqueness
      const existingRoll = await prisma.studentProfile.findUnique({
        where: { rollNumber: parsed.data.rollNumber },
      });
      if (existingRoll) {
        return NextResponse.json(
          { error: "A student with this roll number already exists." },
          { status: 409 }
        );
      }

      const user = await prisma.user.create({
        data: {
          name: parsed.data.name,
          email: parsed.data.email,
          passwordHash,
          role: "STUDENT",
          studentProfile: {
            create: {
              rollNumber: parsed.data.rollNumber,
              department: parsed.data.department,
              year: parsed.data.year,
              className: parsed.data.className,
            },
          },
        },
      });

      return NextResponse.json({ id: user.id }, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  } catch (err) {
    console.error("Registration error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
