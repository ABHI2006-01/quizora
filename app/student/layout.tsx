export const instant = false;

import { connection } from "next/server";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import StudentSidebar from "@/components/student/Sidebar";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const session = await auth();
  if (!session || session.user.role !== "STUDENT") redirect("/");

  return (
    <div className="flex min-h-screen bg-slate-50">
      <StudentSidebar user={{ name: session.user.name ?? "", email: session.user.email ?? "" }} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
