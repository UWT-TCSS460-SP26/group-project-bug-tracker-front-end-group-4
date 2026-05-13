"use client";

import { useState, useTransition } from "react";
import type { IssueStatus } from "@/lib/types";
import { ISSUE_STATUSES } from "@/lib/types";
import { changeStatus, deleteIssueAction } from "./actions";

const STATUS_COLORS: Record<IssueStatus, string> = {
  OPEN: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  IN_PROGRESS:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  RESOLVED:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  WONT_FIX: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
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
          className={`text-sm border rounded px-3 py-1.5 font-medium appearance-none cursor-pointer disabled:opacity-50 ${
            STATUS_COLORS[status]
          } border-gray-200 dark:border-gray-700`}
        >
          {ISSUE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>

        {/* Delete button */}
        {!showConfirmDelete ? (
          <button
            onClick={() => setShowConfirmDelete(true)}
            className="text-sm text-red-600 hover:text-red-500 font-medium"
          >
            Delete
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="text-sm px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-medium disabled:opacity-50"
            >
              {isPending ? "Deleting..." : "Confirm"}
            </button>
            <button
              onClick={() => setShowConfirmDelete(false)}
              disabled={isPending}
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
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
