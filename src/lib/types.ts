// ── Enums / Literal Unions ────────────────────────────────────────────

export type IssueStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "WONT_FIX";

export const ISSUE_STATUSES: IssueStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "WONT_FIX",
];

export type SortByField = "createdAt" | "status" | "title";

export type SortOrder = "asc" | "desc";

// ── Shared / Utility ──────────────────────────────────────────────────

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  details?: { path: string; message: string }[];
}

// ── Issue Schemas ─────────────────────────────────────────────────────

export interface Issue {
  id: number;
  title: string;
  body: string;
  contact: string;
  status: IssueStatus;
  createdAt: string;
  updatedAt: string;
}

export interface IssueListResponse {
  issues: Issue[];
  pagination: Pagination;
}

export interface IssueSingleResponse {
  issue: Issue;
}

export interface IssueCreateResponse {
  message: string;
  issue: Issue;
}

export interface IssuePatchResponse {
  message: string;
  issue: Issue;
}

export interface IssueDeleteResponse {
  message: string;
  issue: Issue;
}

// ── Request Types ─────────────────────────────────────────────────────

export interface CreateIssueRequest {
  title: string;
  body: string;
  contact: string;
}

export interface PatchIssueRequest {
  title?: string;
  body?: string;
  contact?: string;
  status?: IssueStatus;
}

export interface ListIssuesParams {
  page?: number;
  limit?: number;
  status?: IssueStatus | IssueStatus[];
  sortBy?: SortByField;
  sortOrder?: SortOrder;
}
