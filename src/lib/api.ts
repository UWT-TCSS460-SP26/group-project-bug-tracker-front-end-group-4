import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { ADMIN_ROLES } from "@/lib/types";
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
  UserRole,
  UserProfileResponse,
} from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

function getAuthHeaders(
  session: { accessToken: string } | null,
): Record<string, string> {
  if (!session?.accessToken) return {};
  return { Authorization: `Bearer ${session.accessToken}` };
}

export async function getSessionForApi(): Promise<{
  accessToken: string;
} | null> {
  return getServerSession(authOptions);
}

export async function getMyRole(): Promise<UserRole | null> {
  const session = await getSessionForApi();
  if (!session?.accessToken) return null;

  try {
    const res = await fetch(`${API_URL}/api/users/me`, {
      headers: getAuthHeaders(session),
    });
    if (!res.ok) {
      console.error("getMyRole: non-ok response", res.status);
      return null;
    }
    const body: UserProfileResponse = await res.json();
    return body.user.role;
  } catch (err) {
    console.error("getMyRole: fetch failed", err);
    return null;
  }
}

/** Server-component guard: redirects non-admin users away. */
export async function requireAdmin(): Promise<UserRole> {
  const role = await getMyRole();
  if (!role || !ADMIN_ROLES.includes(role)) {
    redirect("/?error=unauthorized");
  }
  return role;
}

/** Server-action guard: returns null for non-admin users so the caller can return an error. */
export async function checkAdmin(): Promise<UserRole | null> {
  const role = await getMyRole();
  if (!role || !ADMIN_ROLES.includes(role)) return null;
  return role;
}

export async function listIssues(
  params: ListIssuesParams = {},
): Promise<
  | { ok: true; data: IssueListResponse }
  | { ok: false; status: number; error: ApiError }
> {
  const session = await getSessionForApi();
  if (!session?.accessToken) {
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
  id: number,
): Promise<
  | { ok: true; data: IssueSingleResponse }
  | { ok: false; status: number; error: ApiError }
> {
  const session = await getSessionForApi();
  if (!session?.accessToken) {
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
  data: PatchIssueRequest,
): Promise<
  | { ok: true; data: IssuePatchResponse }
  | { ok: false; status: number; error: ApiError }
> {
  const session = await getSessionForApi();
  if (!session?.accessToken) {
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
  id: number,
): Promise<
  | { ok: true; data: IssueDeleteResponse }
  | { ok: false; status: number; error: ApiError }
> {
  const session = await getSessionForApi();
  if (!session?.accessToken) {
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
