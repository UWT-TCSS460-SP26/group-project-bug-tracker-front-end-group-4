"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { patchIssue, deleteIssue, checkAdmin } from "@/lib/api";
import type {
  IssueStatus,
  IssuePatchResponse,
  IssueDeleteResponse,
} from "@/lib/types";

export type ActionResult =
  | { ok: true; data: IssuePatchResponse | IssueDeleteResponse }
  | { ok: false; message: string };

export async function changeStatus(
  id: number,
  status: IssueStatus,
): Promise<ActionResult> {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/api/auth/signin");
  }

  if (!(await checkAdmin())) {
    return { ok: false, message: "Your account does not have admin access." };
  }

  const result = await patchIssue(id, { status });
  if (!result.ok && result.status === 401) {
    redirect("/api/auth/signin");
  }
  if (result.ok) {
    revalidatePath(`/issue/${id}`);
    revalidatePath("/dashboard");
    return { ok: true, data: result.data };
  }
  return {
    ok: false,
    message: result.error.message || "Failed to update status",
  };
}

export async function deleteIssueAction(id: number): Promise<ActionResult> {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/api/auth/signin");
  }

  if (!(await checkAdmin())) {
    return { ok: false, message: "Your account does not have admin access." };
  }

  const result = await deleteIssue(id);
  if (!result.ok && result.status === 401) {
    redirect("/api/auth/signin");
  }
  if (result.ok) {
    revalidatePath("/dashboard");
    redirect("/dashboard");
  }
  return {
    ok: false,
    message: result.error.message || "Failed to delete issue",
  };
}
