import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import type {
  Issue,
  IssueListResponse,
  IssueSingleResponse,
  IssuePatchResponse,
  IssueDeleteResponse,
  IssueStatus,
  ListIssuesParams,
  PatchIssueRequest,
  ApiError,
} from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

function getBearerToken(session: { accessToken?: string; idToken?: string } | null): string | null {
  // Prefer id_token (always a JWT) over access_token (may be opaque)
  return session?.idToken || session?.accessToken || null;
}

function getAuthHeaders(session: { accessToken?: string; idToken?: string } | null): Record<string, string> {
  const token = getBearerToken(session);
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

function checkAuth(session: { accessToken?: string; idToken?: string } | null): session is { accessToken?: string; idToken?: string } & { accessToken: string } | { idToken: string } {
  return !!session && !!(session.idToken || session.accessToken);
}

export async function getSessionForApi(): Promise<{
  accessToken?: string;
  idToken?: string;
} | null> {
  return getServerSession(authOptions);
}

export async function listIssues(
  params: ListIssuesParams = {}
): Promise<
  | { ok: true; data: IssueListResponse }
  | { ok: false; status: number; error: ApiError }
> {
  const session = await getSessionForApi();
  if (!checkAuth(session)) {
    return { ok: false, status: 401, error: { message: "Not authenticated" } };
  }

  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);
  if (params.status) {
    if (Array.isArray(params.status)) {
      params.status.forEach((s) => searchParams.append("status", s));
    } else {
      searchParams.set("status", params.status);
    }
  }

  const qs = searchParams.toString();
  const url = `${API_URL}/issues${qs ? `?${qs}` : ""}`;

  const res = await fetch(url, { headers: getAuthHeaders(session) });
  const body = await res.json();

  if (res.ok) return { ok: true, data: body as IssueListResponse };
  return { ok: false, status: res.status, error: body as ApiError };
}

export async function getIssue(
  id: number
): Promise<
  | { ok: true; data: IssueSingleResponse }
  | { ok: false; status: number; error: ApiError }
> {
  const session = await getSessionForApi();
  if (!checkAuth(session)) {
    return { ok: false, status: 401, error: { message: "Not authenticated" } };
  }

  const res = await fetch(`${API_URL}/issues/${id}`, {
    headers: getAuthHeaders(session),
  });
  const body = await res.json();

  if (res.ok) return { ok: true, data: body as IssueSingleResponse };
  return { ok: false, status: res.status, error: body as ApiError };
}

export async function patchIssue(
  id: number,
  data: PatchIssueRequest
): Promise<
  | { ok: true; data: IssuePatchResponse }
  | { ok: false; status: number; error: ApiError }
> {
  const session = await getSessionForApi();
  if (!checkAuth(session)) {
    return { ok: false, status: 401, error: { message: "Not authenticated" } };
  }

  const res = await fetch(`${API_URL}/issues/${id}`, {
    method: "PATCH",
    headers: {
      ...getAuthHeaders(session),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  const body = await res.json();

  if (res.ok) return { ok: true, data: body as IssuePatchResponse };
  return { ok: false, status: res.status, error: body as ApiError };
}

export async function deleteIssue(
  id: number
): Promise<
  | { ok: true; data: IssueDeleteResponse }
  | { ok: false; status: number; error: ApiError }
> {
  const session = await getSessionForApi();
  if (!checkAuth(session)) {
    return { ok: false, status: 401, error: { message: "Not authenticated" } };
  }

  const res = await fetch(`${API_URL}/issues/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(session),
  });
  const body = await res.json();

  if (res.ok) return { ok: true, data: body as IssueDeleteResponse };
  return { ok: false, status: res.status, error: body as ApiError };
}
