"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Sparkles, BookOpen, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function TeacherRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    institution: "",
    designation: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        institution: form.institution,
        designation: form.designation,
        password: form.password,
        role: "TEACHER",
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setLoading(false);
      setError(data.error ?? "Registration failed. Please try again.");
      return;
    }

    // Auto sign in after registration
    await signIn("credentials", {
      email: form.email,
      password: form.password,
      role: "TEACHER",
      redirect: false,
    });

    router.push("/teacher/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Sparkles className="h-6 w-6 text-indigo-600" />
          <span className="text-2xl font-bold text-indigo-700">Quizora</span>
        </div>

        <Card className="border-2 border-indigo-100 shadow-lg">
          <CardHeader className="pb-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-3">
              <BookOpen className="h-6 w-6 text-indigo-600" />
            </div>
            <CardTitle className="text-2xl text-slate-800">Create Teacher Account</CardTitle>
            <CardDescription>Join Quizora to start generating AI-powered quizzes.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Dr. Priya Sharma"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="border-slate-200 focus:border-indigo-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="teacher@school.edu"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="border-slate-200 focus:border-indigo-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="institution">Institution</Label>
                  <Input
                    id="institution"
                    name="institution"
                    placeholder="MIT College"
                    value={form.institution}
                    onChange={handleChange}
                    className="border-slate-200 focus:border-indigo-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="designation">Designation</Label>
                  <Input
                    id="designation"
                    name="designation"
                    placeholder="Professor"
                    value={form.designation}
                    onChange={handleChange}
                    className="border-slate-200 focus:border-indigo-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className="border-slate-200 focus:border-indigo-400 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Repeat your password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  className="border-slate-200 focus:border-indigo-400"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating account...</>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-slate-500">
                Already have an account?{" "}
                <Link href="/teacher/login" className="text-indigo-600 hover:underline font-medium">
                  Sign in
                </Link>
              </p>
              <p className="text-sm text-slate-400">
                <Link href="/" className="hover:text-slate-600">← Back to home</Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
