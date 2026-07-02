export type EmailRecipientResolution = {
  isOverridden: boolean;
  originalRecipients: string[];
  recipients: string[];
};

function readNonEmptyEnv(env: Record<string, string | undefined>, key: string) {
  const value = env[key]?.trim();
  return value ? value : undefined;
}

export function isDevelopmentEmailMode(
  env: Record<string, string | undefined> = process.env,
) {
  const mode = readNonEmptyEnv(env, "AFTERSERVICE_ENV_MODE");

  if (mode) {
    return mode !== "production";
  }

  return env.NODE_ENV !== "production";
}

export function resolveEmailRecipients(
  recipients: string | string[],
  env: Record<string, string | undefined> = process.env,
): EmailRecipientResolution {
  const originalRecipients = (
    Array.isArray(recipients) ? recipients : [recipients]
  )
    .map((recipient) => recipient.trim())
    .filter(Boolean);
  const testEmail = readNonEmptyEnv(env, "TEST_EMAIL");

  if (testEmail && isDevelopmentEmailMode(env)) {
    return {
      isOverridden: true,
      originalRecipients,
      recipients: [testEmail],
    };
  }

  return {
    isOverridden: false,
    originalRecipients,
    recipients: originalRecipients,
  };
}
