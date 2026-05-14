"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import type { Issue, Pagination, IssueStatus, SortByField, SortOrder } from "@/lib/types";
import { ISSUE_STATUSES } from "@/lib/types";

const STATUS_COLORS: Record<IssueStatus, string> = {
  OPEN: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  IN_PROGRESS:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  RESOLVED:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  WONT_FIX: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
};

const SORT_LABELS: Record<SortByField, string> = {
  createdAt: "Created",
  status: "Status",
  title: "Title",
};

const PAGE_SIZE = 20;

export default function IssueList() {
  const { data: session, status: sessionStatus } = useSession();

  const [statusFilter, setStatusFilter] = useState<IssueStatus[]>(() => {
    if (typeof window === "undefined") return ["OPEN"];
    try {
      const stored = sessionStorage.getItem("dashboard-statusFilter");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed as IssueStatus[];
      }
    } catch { /* ignore corrupt data */ }
    return ["OPEN"];
  });
  const [sortBy, setSortBy] = useState<SortByField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(1);

  const [issues, setIssues] = useState<Issue[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchIssues = useCallback(async () => {
    if (sessionStatus !== "authenticated" || !session?.accessToken) return;

    setLoading(true);
    setError("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(PAGE_SIZE));
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      statusFilter.forEach((s) => params.append("status", s));

      const res = await fetch(`${apiUrl}/issues?${params.toString()}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });

      if (res.status === 401) {
        window.location.href = "/api/auth/signin";
        return;
      }

      if (res.status === 403) {
        setError("Your account does not have admin access.");
        setIssues([]);
        setPagination(null);
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({ message: "Could not load issues." }));
        setError(body.message || "Could not load issues.");
        setIssues([]);
        setPagination(null);
        return;
      }

      const body = await res.json();
      setIssues(body.issues);
      setPagination(body.pagination);
    } catch {
      setError("Could not reach the server. Please check your connection.");
      setIssues([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [session, sessionStatus, page, sortBy, sortOrder, statusFilter]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  // Persist status filter so it survives back/forward navigation
  useEffect(() => {
    try {
      sessionStorage.setItem("dashboard-statusFilter", JSON.stringify(statusFilter));
    } catch { /* quota exceeded or private browsing */ }
  }, [statusFilter]);

  // Reset to page 1 when filters or sort change
  function updateFilters(updater: () => void) {
    setPage(1);
    updater();
  }

  function toggleStatus(status: IssueStatus) {
    updateFilters(() => {
      setStatusFilter((prev) => {
        if (prev.includes(status)) {
          return prev.filter((s) => s !== status);
        }
        return [...prev, status];
      });
    });
  }

  function isStatusActive(status: IssueStatus): boolean {
    return statusFilter.includes(status);
  }

  function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  // Auth loading state
  if (sessionStatus === "loading") {
    return (
      <div className="text-center py-16 text-gray-500 dark:text-gray-400">
        Loading...
      </div>
    );
  }

  // Not authenticated
  if (sessionStatus === "unauthenticated") {
    return (
      <div className="text-center py-16 text-gray-500 dark:text-gray-400">
        Please sign in to view issues.
      </div>
    );
  }

  const totalPages = pagination?.totalPages ?? 1;
  const showPagination = totalPages > 1;

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {/* Status filter chips */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-bold text-gray-600 dark:text-gray-300">
            Status:
          </span>
          {ISSUE_STATUSES.map((status) => (
            <button
              key={status}
              onClick={() => toggleStatus(status)}
              className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                isStatusActive(status)
                  ? `${STATUS_COLORS[status]} border-current`
                  : "border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500"
              }`}
            >
              {status.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Sort controls */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-600 dark:text-gray-300">
            Sort:
          </span>
          <select
            value={sortBy}
            onChange={(e) =>
              updateFilters(() => setSortBy(e.target.value as SortByField))
            }
            className="text-sm border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
          >
            {(Object.entries(SORT_LABELS) as [SortByField, string][]).map(
              ([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              )
            )}
          </select>
          <button
            onClick={() =>
              updateFilters(() =>
                setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
              )
            }
            className="text-sm border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-900 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            title={sortOrder === "asc" ? "Descending" : "Ascending"}
          >
            {sortOrder === "asc" ? "\u2191" : "\u2193"}
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && !loading && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Issue table */}
      {loading && issues.length === 0 ? (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          Loading issues...
        </div>
      ) : issues.length === 0 && !loading ? (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
          No issues found.
        </div>
      ) : (
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <th className="pl-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Contact
                </th>
                <th className="pr-4 py-2.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {issues.map((issue) => (
                <tr
                  key={issue.id}
                  className="bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <td className="pl-4 py-3 w-0">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${
                        STATUS_COLORS[issue.status]
                      }`}
                    >
                      {issue.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <Link
                      href={`/issue/${issue.id}`}
                      className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      {issue.title}
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {issue.contact}
                  </td>
                  <td className="pr-4 py-3 text-sm text-gray-400 dark:text-gray-500 whitespace-nowrap text-right">
                    {formatDate(issue.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Loading overlay for subsequent page loads */}
      {loading && issues.length > 0 && (
        <div className="text-center py-4 text-sm text-gray-400 dark:text-gray-500">
          Updating...
        </div>
      )}

      {/* Pagination */}
      {showPagination && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600 dark:text-gray-400">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span>
            Page {pagination?.page ?? page} of {totalPages}{" "}
            <span className="text-gray-400">
              ({pagination?.total ?? 0} issues)
            </span>
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
