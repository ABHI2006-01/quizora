"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Sparkles, GraduationCap, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function StudentRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    rollNumber: "",
    department: "",
    year: "",
    className: "",
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
        rollNumber: form.rollNumber,
        department: form.department,
        year: form.year,
        className: form.className,
        password: form.password,
        role: "STUDENT",
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
      role: "STUDENT",
      redirect: false,
    });

    router.push("/student/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Sparkles className="h-6 w-6 text-violet-600" />
          <span className="text-2xl font-bold text-violet-700">Quizora</span>
        </div>

        <Card className="border-2 border-violet-100 shadow-lg">
          <CardHeader className="pb-4">
            <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center mb-3">
              <GraduationCap className="h-6 w-6 text-violet-600" />
            </div>
            <CardTitle className="text-2xl text-slate-800">Create Student Account</CardTitle>
            <CardDescription>Register once and access all your quizzes and results.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Rahul Sharma"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="border-slate-200 focus:border-violet-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="rahul@college.edu"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="border-slate-200 focus:border-violet-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rollNumber">Roll Number</Label>
                  <Input
                    id="rollNumber"
                    name="rollNumber"
                    placeholder="22CS001"
                    value={form.rollNumber}
                    onChange={handleChange}
                    required
                    className="border-slate-200 focus:border-violet-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    name="department"
                    placeholder="Computer Science"
                    value={form.department}
                    onChange={handleChange}
                    className="border-slate-200 focus:border-violet-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    name="year"
                    placeholder="3rd Year"
                    value={form.year}
                    onChange={handleChange}
                    className="border-slate-200 focus:border-violet-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="className">Class / Division</Label>
                <Input
                  id="className"
                  name="className"
                  placeholder="CSE-A"
                  value={form.className}
                  onChange={handleChange}
                  className="border-slate-200 focus:border-violet-400"
                />
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
                    className="border-slate-200 focus:border-violet-400 pr-10"
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
                  className="border-slate-200 focus:border-violet-400"
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
                className="w-full bg-violet-600 hover:bg-violet-700 text-white"
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
                <Link href="/student/login" className="text-violet-600 hover:underline font-medium">
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
