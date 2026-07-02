"use client";

if (process.env.NODE_ENV === "production") {
  throw new Error("DevAuthStore must not be imported in production.");
}

export type DevAccount = {
  name: string;
  email: string;
  password: string;
  workspaceName?: string;
  createdAt: string;
};

const STORAGE_KEY = "afterservice.dev.accounts";

function getAccounts(): DevAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DevAccount[]) : [];
  } catch {
    return [];
  }
}

function saveAccounts(accounts: DevAccount[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  } catch {
    // dev store is best-effort
  }
}

export function addDevAccount(account: Omit<DevAccount, "createdAt">) {
  const accounts = getAccounts().filter((a) => a.email !== account.email);
  accounts.unshift({
    ...account,
    createdAt: new Date().toISOString(),
  });
  if (accounts.length > 20) accounts.length = 20;
  saveAccounts(accounts);
}

export function getDevAccounts(): DevAccount[] {
  return getAccounts();
}

export function getDevAccount(email: string): DevAccount | undefined {
  return getAccounts().find((a) => a.email === email);
}

export function clearDevAccounts() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
