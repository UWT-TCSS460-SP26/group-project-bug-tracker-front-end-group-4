import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth-options";
import { listIssues } from "@/lib/api";
import type {
  IssueStatus,
  SortByField,
  SortOrder,
} from "@/lib/types";
import IssueList from "./issue-list";

interface DashboardPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/api/auth/signin?callbackUrl=/dashboard");
  }

  const params = await searchParams;

  const page = params.page ? parseInt(String(params.page), 10) || 1 : 1;
  const sortBy = (params.sortBy as SortByField) || "createdAt";
  const sortOrder = (params.sortOrder as SortOrder) || "desc";

  let statusFilter: IssueStatus | IssueStatus[] | undefined;
  if (params.status) {
    if (Array.isArray(params.status)) {
      statusFilter = params.status as IssueStatus[];
    } else {
      statusFilter = params.status as IssueStatus;
    }
  }

  const result = await listIssues({
    page,
    limit: 20,
    status: statusFilter,
    sortBy,
    sortOrder,
  });

  if (!result.ok) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8">
        {result.status === 403 ? (
          <div className="max-w-2xl mx-auto text-center py-20">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Not authorized
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your account does not have admin access. Contact your instructor to
              promote your account.
            </p>
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-500 underline"
            >
              Go to issue submission form
            </Link>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto text-center py-20">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {result.error.message || "Could not load issues."}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Issues
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {session.user?.email}
            </span>
            <Link
              href="/api/auth/signout"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              Sign out
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <IssueList
          issues={result.data.issues}
          pagination={result.data.pagination}
          currentStatus={statusFilter}
          currentSortBy={sortBy}
          currentSortOrder={sortOrder}
        />
      </main>
    </div>
  );
}
