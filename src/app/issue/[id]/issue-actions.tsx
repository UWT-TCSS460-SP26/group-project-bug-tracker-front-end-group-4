"use client";

import { useState, useRef, useEffect, useTransition } from "react";
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

const STATUS_HOVER: Record<IssueStatus, string> = {
  OPEN: "hover:bg-green-200 dark:hover:bg-green-900/50",
  IN_PROGRESS: "hover:bg-yellow-200 dark:hover:bg-yellow-900/50",
  RESOLVED: "hover:bg-purple-200 dark:hover:bg-purple-900/50",
  WONT_FIX: "hover:bg-rose-200 dark:hover:bg-rose-900/50",
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
  const [open, setOpen] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function handleStatusChange(newStatus: IssueStatus) {
    if (newStatus === status) {
      setOpen(false);
      return;
    }
    setOpen(false);
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
      if (!result.ok) setError(result.message);
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-3">
        {/* Status dropdown */}
        <div ref={ref} className="relative">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            disabled={isPending}
            className={`inline-flex items-center gap-1.5 text-sm border rounded-md px-3 py-1.5 font-medium cursor-pointer disabled:opacity-50 transition-shadow ${STATUS_COLORS[status]} border-gray-200 dark:border-gray-700`}
          >
            {status.replace("_", " ")}
            <svg
              className={`w-3.5 h-3.5 opacity-60 transition-transform ${open ? "rotate-180" : ""}`}
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m4 6 4 4 4-4" />
            </svg>
          </button>

          {open && (
            <div className="absolute z-20 right-0 mt-1.5 w-40 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
              {ISSUE_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleStatusChange(s)}
                  className={`w-full text-left text-sm px-3 py-2 font-medium transition-colors ${STATUS_COLORS[s]} ${STATUS_HOVER[s]} ${s === status ? "ring- ring-inset ring-gray-300 dark:ring-gray-600" : ""}`}
                >
                  {s.replace("_", " ")}
                </button>
              ))}
            </div>
          )}
        </div>

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
              className="text-sm px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium disabled:opacity-50"
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
