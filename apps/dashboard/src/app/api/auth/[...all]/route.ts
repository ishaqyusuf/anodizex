import { auth } from "@anodizex/auth";
import { appendAuthCookieExpiryFallbacks } from "@/lib/session-cookies";

const AUTH_DEBUG =
  process.env.AFTERSERVICE_AUTH_DEBUG === "true" ||
  process.env.AUTH_DEBUG === "true";

function authLogPayload(request: Request, response?: Response) {
  const url = new URL(request.url);

  return {
    method: request.method,
    path: url.pathname,
    status: response?.status,
    statusText: response?.statusText,
  };
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: AUTH_DEBUG ? error.stack : undefined,
    };
  }

  return { message: String(error) };
}

async function logAuthFailure(request: Request, response: Response) {
  if (!AUTH_DEBUG || response.status < 400) {
    return;
  }

  const body = await response
    .clone()
    .text()
    .then((value) => value.slice(0, 1_000))
    .catch(() => "");

  console.error(
    "[afterservice-auth-debug] non-2xx response",
    JSON.stringify({
      ...authLogPayload(request, response),
      body,
    }),
  );
}

async function handleAuth(request: Request) {
  try {
    const response = await auth.handler(request);
    await logAuthFailure(request, response);
    if (isSignOutRequest(request)) {
      return appendAuthCookieExpiryFallbacks(response);
    }
    return response;
  } catch (error) {
    console.error(
      "[afterservice-auth-debug] handler threw",
      JSON.stringify({
        ...authLogPayload(request),
        error: serializeError(error),
      }),
    );

    throw error;
  }
}

function isSignOutRequest(request: Request) {
  const url = new URL(request.url);
  return request.method === "POST" && url.pathname.endsWith("/sign-out");
}

export function GET(request: Request) {
  return handleAuth(request);
}

export function POST(request: Request) {
  return handleAuth(request);
}
