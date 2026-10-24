"use client";

import { useSyncExternalStore } from "react";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:5000";

let accessToken: string | null = null;
let currentUser: AuthUser | null = null;
const authListeners = new Set<() => void>();

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  position?: string;
  state?: string;
  district?: string;
};

function notifyAuthListeners() {
  authListeners.forEach((listener) => listener());
}

function setSession(user: AuthUser, token: string) {
  accessToken = token;
  currentUser = user;
  notifyAuthListeners();
}

export function subscribeToAuth(listener: () => void) {
  authListeners.add(listener);
  return () => {
    authListeners.delete(listener);
  };
}

export function useCurrentUser() {
  return useSyncExternalStore(
    subscribeToAuth,
    () => currentUser,
    () => null,
  );
}

async function readSessionResponse(response: Response, fallbackMessage: string) {
  const result = (await response.json()) as {
    success?: boolean;
    data?: { accessToken: string; user: AuthUser };
    error?: { message?: string };
  };

  if (!response.ok || !result.data?.accessToken || !result.data.user) {
    throw new Error(result.error?.message ?? fallbackMessage);
  }

  setSession(result.data.user, result.data.accessToken);
  return result.data.user;
}

export async function signIn(email: string, password: string) {
  const response = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  return readSessionResponse(response, "Unable to sign in. Please try again.");
}

export type RegistrationInput = {
  name: string;
  email: string;
  password: string;
  position: string;
  state: string;
  district: string;
};

export async function signUp(input: RegistrationInput) {
  const response = await fetch(`${apiBaseUrl}/api/v1/auth/register`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  return readSessionResponse(response, "Unable to create your account. Please try again.");
}

export async function signOut() {
  const response = await fetch(`${apiBaseUrl}/api/v1/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
  const result = (await response.json()) as {
    success?: boolean;
    error?: { message?: string };
  };

  if (!response.ok || !result.success) {
    throw new Error(result.error?.message ?? "Unable to sign out. Please try again.");
  }

  accessToken = null;
  currentUser = null;
  notifyAuthListeners();
}

export function getAccessToken() {
  return accessToken;
}
