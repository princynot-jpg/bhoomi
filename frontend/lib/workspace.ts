import { getAccessToken } from "@/lib/auth";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:5000";

export type WorkspaceRecord = {
  _id: string;
  reference: string;
  project: string;
  district: string;
  state: string;
  status: string;
  updatedAt: string;
  [field: string]: string | number;
};

async function workspaceRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken();
  if (!token) throw new Error("Sign in to access workspace records.");

  const response = await fetch(`${apiBaseUrl}/api/v1/workspace/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  const result = (await response.json()) as {
    success?: boolean;
    data?: T;
    error?: { message?: string };
  };

  if (!response.ok || !result.success || !result.data) {
    throw new Error(result.error?.message ?? "Unable to load workspace records.");
  }
  return result.data;
}

export async function listWorkspaceRecords(path: string) {
  const result = await workspaceRequest<{ records: WorkspaceRecord[] }>(path);
  return result.records;
}

export async function createWorkspaceRecord(path: string, record: Record<string, string | number>) {
  const result = await workspaceRequest<{ record: WorkspaceRecord }>(path, {
    method: "POST",
    body: JSON.stringify(record),
  });
  return result.record;
}

export async function updateWorkspaceRecordStatus(path: string, id: string, status: string) {
  const result = await workspaceRequest<{ record: WorkspaceRecord }>(`${path}/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  return result.record;
}
