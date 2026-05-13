"use client";

import { useState, useTransition } from "react";
import type { IssueStatus } from "@/lib/types";
import { ISSUE_STATUSES } from "@/lib/types";
import { changeStatus, deleteIssueAction } from "./actions";

export const STATUS_COLORS: Record<IssueStatus, string> = {
  OPEN: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  IN_PROGRESS:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  RESOLVED:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  WONT_FIX: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
};

export const DROP_DOWN_COLORS: Record<IssueStatus, string> = {
  OPEN: "text-green-800 dark:bg-green-900/30 dark:text-green-400",
  IN_PROGRESS: "text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  RESOLVED: "text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  WONT_FIX: "text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
};

interface IssueActionsProps {
  issueId: number;
  currentStatus: IssueStatus;
}

export default function IssueActions({
  issueId,
  currentStatus,
}: IssueActionsProps) {
  const [status, setStatus] = useState<IssueStatus>(currentStatus);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleStatusChange(newStatus: IssueStatus) {
    if (newStatus === status) return;
    setError("");

    startTransition(async () => {
      const result = await changeStatus(issueId, newStatus);
      if (result.ok) {
        setStatus(newStatus);
      } else {
        setError(result.message);
      }
    });
  }

  function handleDelete() {
    setError("");

    startTransition(async () => {
      const result = await deleteIssueAction(issueId);
      if (!result.ok) {
        setError(result.message);
      }
      // If ok, the server action redirects to /dashboard
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-3">
        {/* Status dropdown */}
        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value as IssueStatus)}
          disabled={isPending}
          className={`text-sm border rounded pl-3 pr-8 py-1.5 font-medium cursor-pointer disabled:opacity-50 ${STATUS_COLORS[status]} border-gray-300 dark:border-gray-700`}
        >
          {ISSUE_STATUSES.map((s) => (
            <option
              key={s}
              value={s}
              className={`appearance-none text-sm border rounded pl-3 pr-8 py-1.5 font-medium cursor-pointer disabled:opacity-50 border-gray-700 ${DROP_DOWN_COLORS[s]}`}
            >
              {s.replace("_", " ")}
            </option>
          ))}
        </select>

        {/* Delete button */}
        {!showConfirmDelete ? (
          <button
            onClick={() => setShowConfirmDelete(true)}
            className="text-sm px-3 py-1.5 border border-red-300 dark:border-red-800 rounded-md font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
          >
            Delete
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="text-sm px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded font-medium disabled:opacity-50"
            >
              {isPending ? "Deleting..." : "Confirm"}
            </button>
            <button
              onClick={() => setShowConfirmDelete(false)}
              disabled={isPending}
              className="text-sm px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
