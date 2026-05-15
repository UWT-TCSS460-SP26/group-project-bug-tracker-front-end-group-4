import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth-options";
import { getIssue, requireAdmin } from "@/lib/api";
import IssueActions, { STATUS_COLORS } from "./issue-actions";

interface IssueDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function IssueDetailPage({
  params,
}: IssueDetailPageProps) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session) {
    redirect(`/api/auth/signin?callbackUrl=/issue/${id}`);
  }

  await requireAdmin();

  const issueId = parseInt(id, 10);

  if (isNaN(issueId)) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black">
        <div className="mx-auto w-full max-w-6xl px-6 py-16 text-center">
          <h1 className="text-xl font-bold text-red-600 mb-2">
            Invalid issue ID
          </h1>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-zinc-900 underline underline-offset-4 hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-400"
          >
            Back to issues
          </Link>
        </div>
      </div>
    );
  }

  const result = await getIssue(issueId);

  if (!result.ok) {
    if (result.status === 401) {
      redirect(`/api/auth/signin?callbackUrl=/issue/${id}`);
    }
    return (
      <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black">
        <div className="mx-auto w-full max-w-6xl px-6 py-16 text-center">
          {result.status === 404 ? (
            <>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                Issue not found
              </h1>
              <p className="text-zinc-500 mb-4">
                This issue may have been deleted or never existed.
              </p>
            </>
          ) : result.status === 403 ? (
            <>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                Not authorized
              </h1>
              <p className="text-zinc-500 mb-4">
                Your account does not have admin access.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                Something went wrong
              </h1>
              <p className="text-zinc-500 mb-4">
                {result.error.message || "Could not load this issue."}
              </p>
            </>
          )}
          <Link
            href="/dashboard"
            className="text-sm font-medium text-zinc-900 underline underline-offset-4 hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-400"
          >
            Back to issues
          </Link>
        </div>
      </div>
    );
  }

  const issue = result.data.issue;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm font-semibold tracking-tight text-zinc-900 transition-colors hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-400"
            >
              Bug Tracker
            </Link>
            <span className="text-zinc-300 dark:text-zinc-700">/</span>
            <Link
              href="/dashboard"
              className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              Issues
            </Link>
            <span className="text-zinc-300 dark:text-zinc-700">/</span>
            <span className="text-sm text-zinc-400">#{issue.id}</span>
          </div>
          <Link
            href="/api/auth/signout"
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Sign out
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-8">
        <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          {/* Issue header */}
          <div className="px-6 pt-6">
            <div className="flex items-start gap-4 justify-between">
              <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                {issue.title}
              </h1>
              <IssueActions issueId={issue.id} currentStatus={issue.status} />
            </div>
          </div>

          {/* Meta info */}
          <div className="px-6 mt-4 flex flex-wrap items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
            <span
              className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[issue.status]}`}
            >
              {issue.status.replace("_", " ")}
            </span>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <span>
              Created{" "}
              {new Date(issue.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
            {issue.updatedAt !== issue.createdAt && (
              <>
                <span className="text-zinc-300 dark:text-zinc-700">|</span>
                <span>
                  Updated{" "}
                  {new Date(issue.updatedAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </>
            )}
          </div>

          {/* Issue body */}
          <div className="px-6 py-6 mt-4 border-t border-zinc-200 dark:border-zinc-800">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap text-zinc-700 dark:text-zinc-300 leading-relaxed">
                {issue.body}
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-sm text-zinc-500 dark:text-zinc-400">
              Contact:{" "}
              <span className="text-zinc-700 dark:text-zinc-300">{issue.contact}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
