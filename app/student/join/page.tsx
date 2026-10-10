export const instant = false;

import { connection } from "next/server";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import JoinQuizClient from "./JoinQuizClient";

export default async function JoinQuizPage() {
  await connection();
  const session = await auth();
  if (!session || session.user.role !== "STUDENT") redirect("/");

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <JoinQuizClient />
    </div>
  );
}