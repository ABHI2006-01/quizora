export const instant = false;

import { connection } from "next/server";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import WizardContainer from "@/components/teacher/GenerateWizard/WizardContainer";

export default async function NewQuizPage() {
  await connection();
  const session = await auth();
  if (!session || session.user.role !== "TEACHER") redirect("/");

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <WizardContainer />
    </div>
  );
}
