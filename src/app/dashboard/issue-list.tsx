"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

interface IssueListProps {
  issues: Issue[];
  pagination: Pagination;
  currentStatus?: IssueStatus | IssueStatus[];
  currentSortBy: SortByField;
  currentSortOrder: SortOrder;
}

export default function IssueList({
  issues,
  pagination,
  currentStatus,
  currentSortBy,
  currentSortOrder,
}: IssueListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [localStatus, setLocalStatus] = useState(currentStatus);

  useEffect(() => {
    setLocalStatus(currentStatus);
  }, [currentStatus]);

  function updateQuery(updates: Record<string, string | string[] | undefined>) {
    const next = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(updates)) {
      next.delete(key);
      if (value === undefined) continue;
      if (Array.isArray(value)) {
        value.forEach((v) => next.append(key, v));
      } else {
        next.set(key, value);
      }
    }

    // Reset to page 1 when filters change
    if (!("page" in updates)) {
      next.delete("page");
    }

    router.push(`/dashboard?${next.toString()}`);
  }

  function toggleStatus(status: IssueStatus) {
    const current = new Set(
      Array.isArray(localStatus)
        ? localStatus
        : localStatus
          ? [localStatus]
          : []
    );

    if (current.has(status)) {
      current.delete(status);
    } else {
      current.add(status);
    }

    const arr = Array.from(current);
    setLocalStatus(arr.length > 0 ? arr : undefined);
    updateQuery({ status: arr.length > 0 ? arr : undefined });
  }

  function isStatusActive(status: IssueStatus): boolean {
    if (!localStatus) return false;
    if (Array.isArray(localStatus)) return localStatus.includes(status);
    return localStatus === status;
  }

  function formatDate(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 30) return `${diffDays} days ago`;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  }

  const totalPages = pagination.totalPages;
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
            value={currentSortBy}
            onChange={(e) =>
              updateQuery({ sortBy: e.target.value as SortByField })
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
              updateQuery({
                sortOrder: currentSortOrder === "asc" ? "desc" : "asc",
              })
            }
            className="text-sm border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-900 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            title={
              currentSortOrder === "asc" ? "Descending" : "Ascending"
            }
          >
            {currentSortOrder === "asc" ? "\u2191" : "\u2193"}
          </button>
        </div>
      </div>

      {/* Issue table */}
      {issues.length === 0 ? (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
          No issues found.
        </div>
      ) : (
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="sr-only">
              <tr>
                <th>Status</th>
                <th>Title</th>
                <th>Contact</th>
                <th>Created</th>
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

      {/* Pagination */}
      {showPagination && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600 dark:text-gray-400">
          <button
            disabled={pagination.page <= 1}
            onClick={() => updateQuery({ page: String(pagination.page - 1) })}
            className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span>
            Page {pagination.page} of {pagination.totalPages}{" "}
            <span className="text-gray-400">
              ({pagination.total} issues)
            </span>
          </span>
          <button
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => updateQuery({ page: String(pagination.page + 1) })}
            className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
