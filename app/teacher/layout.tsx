export const instant = false;

import { connection } from "next/server";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import TeacherSidebar from "@/components/teacher/Sidebar";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const session = await auth();
  if (!session || session.user.role !== "TEACHER") redirect("/");

  return (
    <div className="flex min-h-screen bg-slate-50">
      <TeacherSidebar user={{ name: session.user.name ?? "", email: session.user.email ?? "" }} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
