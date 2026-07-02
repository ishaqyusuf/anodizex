"use client";

if (process.env.NODE_ENV === "production") {
  throw new Error("DevSignupFab must not be imported in production.");
}

import { Button } from "@afterservice/ui";
import { useState } from "react";

export type SignUpPresetValues = {
  name: string;
  email: string;
  password: string;
};

type Props = {
  onFill: (values: SignUpPresetValues) => void;
};

function makeRandomPreset(): SignUpPresetValues {
  const id = Math.random().toString(36).slice(2, 7);
  const firstNames = ["Amira", "Omar", "Fatima", "James", "Yasmin"];
  const lastNames = ["Haddad", "Nasser", "Al-Hassan", "Adeyemi", "Mansour"];
  const firstName =
    firstNames[Math.floor(Math.random() * firstNames.length)] ?? "Amira";
  const lastName =
    lastNames[Math.floor(Math.random() * lastNames.length)] ?? "Haddad";

  return {
    name: `${firstName} ${lastName}`,
    email: `dev-${id}@afterservice.test`,
    password: "lorem-ipsum",
  };
}

export function DevSignupFab({ onFill }: Props) {
  const [open, setOpen] = useState(false);

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
          Quick fill sign-up
        </div>
        <Button
          type="button"
          onClick={() => {
            onFill(makeRandomPreset());
            setOpen(false);
          }}
          variant="ghost"
          style={{
            width: "100%",
            justifyContent: "flex-start",
            fontWeight: 600,
            color: "#3f6f51",
          }}
        >
          Random new user
        </Button>
      </div>
      <Button size="sm" variant="secondary" onClick={() => setOpen((o) => !o)}>
        {open ? "Close" : "Quick fill"}
      </Button>
    </div>
  );
}
