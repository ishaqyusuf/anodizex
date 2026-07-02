"use client";

if (process.env.NODE_ENV === "production") {
  throw new Error("DevLoginFab must not be imported in production.");
}

import { Button } from "@afterservice/ui";
import { useState } from "react";
import type { DevAccount } from "./dev-auth-store";
import { getDevAccounts } from "./dev-auth-store";

type Props = {
  onFill: (account: DevAccount) => void;
  onSignIn: (account: DevAccount) => void;
};

export function DevLoginFab({ onFill, onSignIn }: Props) {
  const [open, setOpen] = useState(false);
  const accounts = getDevAccounts();

  if (accounts.length === 0) return null;

  return (
    <div style={{ position: "fixed", bottom: 16, right: 16, zIndex: 9999 }}>
      <div
        style={{
          position: "absolute",
          bottom: "100%",
          right: 0,
          marginBottom: 8,
          display: open ? "block" : "none",
          minWidth: 240,
          border: "1px solid #d4dbd0",
          borderRadius: 8,
          background: "#ffffff",
          boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "6px 10px",
            fontSize: 11,
            fontWeight: 600,
            color: "#5e6a62",
            borderBottom: "1px solid #d9ded6",
            background: "#f6f7f4",
          }}
        >
          Dev quick sign-in
        </div>
        {accounts.map((account) => (
          <div
            key={account.email}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 10px",
              borderBottom: "1px solid #f2f5ef",
            }}
          >
            <div style={{ fontSize: 12, lineHeight: 1.4 }}>
              <div style={{ fontWeight: 600, color: "#17211b" }}>
                {account.name}
              </div>
              <div style={{ color: "#5e6a62" }}>{account.email}</div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  onFill(account);
                  setOpen(false);
                }}
              >
                Fill
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  onSignIn(account);
                  setOpen(false);
                }}
              >
                Sign in
              </Button>
            </div>
          </div>
        ))}
      </div>
      <Button size="sm" variant="secondary" onClick={() => setOpen((o) => !o)}>
        {open ? "Close" : "Dev accounts"}
      </Button>
    </div>
  );
}
