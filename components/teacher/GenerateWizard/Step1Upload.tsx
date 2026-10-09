"use client";

import React, { useCallback, useRef } from "react";
import { UploadCloud, FileText, CheckCircle, AlertCircle, X, ChevronDown, ChevronUp, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { nanoid } from "nanoid";

export interface UploadedFile {
  id: string;
  file?: File;
  progress: number;
  status: "uploading" | "success" | "error";
  fileName: string;
  fileType: string;
  fileUrl?: string;
  extractedText?: string;
  warning?: string;
  errorMessage?: string;
  isExpanded?: boolean;
}

interface Step1UploadProps {
  files: UploadedFile[];
  setFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
  onNext: () => void;
}

const SUPPORTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp"
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export default function Step1Upload({ files, setFiles, onNext }: Step1UploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = React.useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const uploadFile = async (file: File, id: string) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Simulate progress somewhat
      const progressInterval = setInterval(() => {
        setFiles(prev => prev.map(f => {
          if (f.id === id && f.progress < 90) {
            return { ...f, progress: f.progress + 10 };
          }
          return f;
        }));
      }, 500);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload file");
      }

      setFiles(prev => prev.map(f => {
        if (f.id === id) {
          return {
            ...f,
            status: "success",
            progress: 100,
            fileUrl: data.fileUrl,
            extractedText: data.extractedText,
            warning: data.warning,
          };
        }
        return f;
      }));
    } catch (error: any) {
      setFiles(prev => prev.map(f => {
        if (f.id === id) {
          return {
            ...f,
            status: "error",
            progress: 0,
            errorMessage: error.message || "An unknown error occurred",
          };
        }
        return f;
      }));
    }
  };

  const processFiles = (newFiles: File[]) => {
    const validFiles = newFiles.slice(0, 5 - files.length).map(file => {
      const id = nanoid();

      let error = "";
      if (file.size > MAX_FILE_SIZE) error = "File too large (max 20MB)";
      else if (!SUPPORTED_TYPES.includes(file.type) && !file.name.endsWith(".docx") && !file.name.endsWith(".doc")) {
        error = "Unsupported file type";
      }

      const fileObj: UploadedFile = {
        id,
        file,
        fileName: file.name,
        fileType: file.type,
        status: error ? "error" : "uploading",
        progress: error ? 0 : 0,
        errorMessage: error || undefined,
        isExpanded: false
      };

      if (!error) {
        uploadFile(file, id);
      }

      return fileObj;
    });

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      processFiles(droppedFiles);
    }
  }, [files]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const selectedFiles = Array.from(e.target.files);
      processFiles(selectedFiles);
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const toggleExpand = (id: string) => {
    setFiles(prev => prev.map(f =>
      f.id === id ? { ...f, isExpanded: !f.isExpanded } : f
    ));
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="h-8 w-8 text-blue-500" />;
    return <FileText className="h-8 w-8 text-indigo-500" />;
  };

  const hasSuccessfulUpload = files.some(f => f.status === "success" && f.extractedText);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Upload Study Material</h2>
        <p className="text-slate-500 mt-1">
          Upload PDFs, Word docs, Presentations, or Images. Our AI will read them to generate the quiz.
        </p>
      </div>

      <div
        className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-colors cursor-pointer
          ${dragActive ? "border-indigo-500 bg-indigo-50" : "border-slate-300 bg-slate-50 hover:bg-slate-100"}
          ${files.length >= 5 ? "opacity-50 pointer-events-none" : ""}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={SUPPORTED_TYPES.join(",")}
          className="hidden"
          onChange={handleChange}
          disabled={files.length >= 5}
        />
        <div className="bg-indigo-100 p-4 rounded-full mb-4">
          <UploadCloud className="h-8 w-8 text-indigo-600" />
        </div>
        <p className="text-slate-900 font-medium mb-1">Click or drag & drop to upload</p>
        <p className="text-slate-500 text-sm">PDF, DOCX, PPTX, TXT, or Image (max 20MB)</p>
        {files.length >= 5 && (
          <p className="text-red-500 text-sm mt-2 font-medium">Maximum 5 files allowed</p>
        )}
      </div>

      {files.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900">Uploaded Files</h3>
          {files.map(file => (
            <Card key={file.id} className="overflow-hidden border-slate-200">
              <CardContent className="p-0">
                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="bg-slate-100 p-2 rounded-lg shrink-0">
                      {getFileIcon(file.fileType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{file.fileName}</p>

                      {file.status === "uploading" && (
                        <div className="mt-2 flex items-center gap-2">
                          <Progress value={file.progress} className="h-2 flex-1" />
                          <span className="text-xs text-slate-500 font-medium w-8">{file.progress}%</span>
                        </div>
                      )}

                      {file.status === "success" && (
                        <div className="flex items-center gap-2 mt-1">
                          <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                          <span className="text-xs text-green-600 font-medium whitespace-nowrap">Extraction complete</span>
                          {file.warning && (
                            <span className="text-xs text-amber-600 ml-2 truncate inline-block max-w-[200px]" title={file.warning}>
                              ⚠️ {file.warning}
                            </span>
                          )}
                        </div>
                      )}

                      {file.status === "error" && (
                        <div className="flex items-center gap-2 mt-1 text-red-500">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          <span className="text-xs font-medium truncate">{file.errorMessage}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {file.status === "success" && (
                      <Button variant="ghost" size="icon" onClick={() => toggleExpand(file.id)}>
                        {file.isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500 hover:bg-red-50" onClick={() => removeFile(file.id)}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {file.isExpanded && file.extractedText && (
                  <div className="bg-slate-50 p-4 border-t border-slate-200">
                    <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Extracted Text Preview</p>
                    <div className="bg-white border border-slate-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                      <p className="text-sm text-slate-700 whitespace-pre-wrap font-mono">
                        {file.extractedText.slice(0, 1000)}
                        {file.extractedText.length > 1000 && <span className="text-slate-400">... (truncated for preview)</span>}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex justify-end pt-4">
        <Button
          size="lg"
          onClick={onNext}
          disabled={!hasSuccessfulUpload}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          Next: Configure Quiz
        </Button>
      </div>
    </div>
  );
}
