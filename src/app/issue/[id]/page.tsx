import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth-options";
import { getIssue } from "@/lib/api";
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
  const issueId = parseInt(id, 10);

  if (isNaN(issueId)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-xl font-bold text-red-600 mb-2">
            Invalid issue ID
          </h1>
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-500 underline"
          >
            Back to issues
          </Link>
        </div>
      </div>
    );
  }

  const result = await getIssue(issueId);

  if (!result.ok) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8">
        <div className="max-w-6xl mx-auto">
          {result.status === 404 ? (
            <>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Issue not found
              </h1>
              <p className="text-gray-500 mb-4">
                This issue may have been deleted or never existed.
              </p>
            </>
          ) : result.status === 403 ? (
            <>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Not authorized
              </h1>
              <p className="text-gray-500 mb-4">
                Your account does not have admin access.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Something went wrong
              </h1>
              <p className="text-gray-500 mb-4">
                {result.error.message || "Could not load this issue."}
              </p>
            </>
          )}
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-500 underline"
          >
            Back to issues
          </Link>
        </div>
      </div>
    );
  }

  const issue = result.data.issue;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              &larr; Issues
            </Link>
            <span className="text-gray-300 dark:text-gray-700">|</span>
            <span className="text-sm text-gray-400">#{issue.id}</span>
          </div>
          <Link
            href="/api/auth/signout"
            className="text-sm px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Sign out
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
          {/* Issue header */}
          <div className="px-6 pt-6">
            <div className="flex items-start gap-4 justify-between">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {issue.title}
              </h1>
              <IssueActions issueId={issue.id} currentStatus={issue.status} />
            </div>
          </div>

          {/* Meta info */}
          <div className="px-6 mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
            <span
              className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[issue.status]}`}
            >
              {issue.status.replace("_", " ")}
            </span>
            <span>{issue.contact}</span>
            <span className="text-gray-300 dark:text-gray-700">|</span>
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
                <span className="text-gray-300 dark:text-gray-700">|</span>
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
          <div className="px-6 py-6 mt-4 border-t border-gray-200 dark:border-gray-800">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
                {issue.body}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
