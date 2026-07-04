#!/usr/bin/env bun

import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { basename, extname, resolve } from "node:path";
import { put } from "@vercel/blob";
import { getDbClient } from "../packages/db/src/index.ts";

const statePath = resolve(process.cwd(), ".telegram-media-import-state.json");
const supportedDocumentPattern = /^(image|video)\//;

function parseArgs(argv) {
  return {
    apply: argv.includes("--apply"),
    limit: Number(
      argv
        .find((arg) => arg.startsWith("--limit="))
        ?.slice("--limit=".length) ?? 100,
    ),
    resetOffset: argv.includes("--reset-offset"),
  };
}

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

function optionalEnv(name) {
  return process.env[name]?.trim() || null;
}

function blobAccessEnv() {
  const value =
    optionalEnv("TELEGRAM_IMPORT_BLOB_ACCESS") ??
    optionalEnv("BLOB_ACCESS") ??
    "private";

  if (value !== "public" && value !== "private") {
    throw new Error(
      "TELEGRAM_IMPORT_BLOB_ACCESS must be either 'public' or 'private'.",
    );
  }

  return value;
}

function readState() {
  if (!existsSync(statePath)) return {};

  try {
    return JSON.parse(readFileSync(statePath, "utf8"));
  } catch {
    return {};
  }
}

function writeState(state) {
  writeFileSync(`${statePath}.tmp`, `${JSON.stringify(state, null, 2)}\n`);
  renameSync(`${statePath}.tmp`, statePath);
}

async function telegramApi(token, method, params = {}) {
  const url = new URL(`https://api.telegram.org/bot${token}/${method}`);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url);
  const payload = await response.json();

  if (!payload.ok) {
    throw new Error(
      `Telegram ${method} failed: ${payload.description ?? response.status}`,
    );
  }

  return payload.result;
}

function safeName(value) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 90) || "telegram-media"
  );
}

function titleFromName(name, mediaType, date) {
  const stem = basename(name, extname(name)).replace(/[-_]+/g, " ").trim();

  if (stem) return stem;

  return `${mediaType === "video" ? "Video" : "Image"} ${date
    .toISOString()
    .slice(0, 10)}`;
}

function mediaFromMessage(update) {
  const message = update.message ?? update.channel_post;
  if (!message) return null;

  if (message.photo?.length) {
    const photo = [...message.photo].sort(
      (a, b) => (b.file_size ?? 0) - (a.file_size ?? 0),
    )[0];
    const capturedAt = new Date(message.date * 1000);

    return {
      caption: message.caption ?? "",
      chatId: String(message.chat.id),
      capturedAt,
      fileId: photo.file_id,
      fileName: `telegram-photo-${message.message_id}.jpg`,
      fileSize: photo.file_size ?? null,
      messageId: message.message_id,
      mediaType: "image",
      mimeType: "image/jpeg",
      sourceUniqueId: photo.file_unique_id,
      updateId: update.update_id,
    };
  }

  if (message.video) {
    const capturedAt = new Date(message.date * 1000);
    const fileName =
      message.video.file_name ?? `telegram-video-${message.message_id}.mp4`;

    return {
      caption: message.caption ?? "",
      chatId: String(message.chat.id),
      capturedAt,
      fileId: message.video.file_id,
      fileName,
      fileSize: message.video.file_size ?? null,
      messageId: message.message_id,
      mediaType: "video",
      mimeType: message.video.mime_type ?? "video/mp4",
      sourceUniqueId: message.video.file_unique_id,
      updateId: update.update_id,
    };
  }

  if (
    message.document &&
    supportedDocumentPattern.test(message.document.mime_type ?? "")
  ) {
    const capturedAt = new Date(message.date * 1000);
    const mediaType = message.document.mime_type?.startsWith("video/")
      ? "video"
      : "image";

    return {
      caption: message.caption ?? "",
      chatId: String(message.chat.id),
      capturedAt,
      fileId: message.document.file_id,
      fileName:
        message.document.file_name ??
        `telegram-${mediaType}-${message.message_id}`,
      fileSize: message.document.file_size ?? null,
      messageId: message.message_id,
      mediaType,
      mimeType: message.document.mime_type ?? null,
      sourceUniqueId: message.document.file_unique_id,
      updateId: update.update_id,
    };
  }

  return null;
}

async function resolveWorkspace(db) {
  const workspaceId = optionalEnv("TELEGRAM_IMPORT_WORKSPACE_ID");
  const workspaceSlug = optionalEnv("TELEGRAM_IMPORT_WORKSPACE_SLUG");

  if (workspaceId) {
    return db.workspace.findUniqueOrThrow({ where: { id: workspaceId } });
  }

  if (workspaceSlug) {
    return db.workspace.findUniqueOrThrow({ where: { slug: workspaceSlug } });
  }

  const existing = await db.workspace.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (existing) {
    return existing;
  }

  return db.workspace.create({
    data: {
      businessType: "Architectural aluminium systems",
      name: "Anodizex",
      serviceCategory: "Aluminium windows, doors, sliding systems, and facades",
      slug: "anodizex",
      websiteSettings: {
        create: {},
      },
    },
  });
}

async function importMedia({
  blobAccess,
  blobToken,
  db,
  item,
  token,
  workspace,
}) {
  const existing = await db.websiteGalleryItem.findUnique({
    where: {
      workspaceId_sourceProvider_sourceUniqueId: {
        sourceProvider: "telegram",
        sourceUniqueId: item.sourceUniqueId,
        workspaceId: workspace.id,
      },
    },
  });

  if (existing) {
    return { action: "skipped", item: existing };
  }

  const file = await telegramApi(token, "getFile", { file_id: item.fileId });
  const downloadUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
  const response = await fetch(downloadUrl);

  if (!response.ok) {
    throw new Error(`Telegram file download failed: ${response.status}`);
  }

  const body = Buffer.from(await response.arrayBuffer());
  const safeFileName = safeName(item.fileName);
  const blobPathname = `anodizex/telegram/${workspace.slug}/${item.sourceUniqueId}-${safeFileName}`;
  const blob = await put(blobPathname, body, {
    access: blobAccess,
    allowOverwrite: false,
    contentType: item.mimeType ?? undefined,
    multipart: body.length > 8 * 1024 * 1024,
    token: blobToken,
  });
  const sortOrder = await db.websiteGalleryItem.count({
    where: { workspaceId: workspace.id },
  });
  const created = await db.websiteGalleryItem.create({
    data: {
      blobPathname: blob.pathname,
      capturedAt: item.capturedAt,
      dateSource: "telegram_message",
      description: item.caption || null,
      isFeatured: true,
      mediaType: item.mediaType,
      sortOrder,
      sourceId: String(item.messageId),
      sourceMetadata: {
        blobAccess,
        chatId: item.chatId,
        fileId: item.fileId,
        fileName: item.fileName,
        fileSize: item.fileSize,
        mimeType: item.mimeType,
        telegramFilePath: file.file_path,
        updateId: item.updateId,
      },
      sourceProvider: "telegram",
      sourceUniqueId: item.sourceUniqueId,
      tags: [],
      title: titleFromName(item.fileName, item.mediaType, item.capturedAt),
      url: blob.url,
      workspaceId: workspace.id,
    },
  });

  return { action: "created", item: created };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const token = requiredEnv("TELEGRAM_BOT_TOKEN");
  const importChatId = optionalEnv("TELEGRAM_IMPORT_CHAT_ID");

  if (args.apply) {
    requiredEnv("BLOB_READ_WRITE_TOKEN");
    requiredEnv("DATABASE_URL");

    if (!importChatId) {
      throw new Error("TELEGRAM_IMPORT_CHAT_ID is required in --apply mode.");
    }
  }

  const state = readState();
  const offset =
    args.resetOffset || !Number.isFinite(state.lastUpdateId)
      ? undefined
      : state.lastUpdateId + 1;
  const updates = await telegramApi(token, "getUpdates", {
    allowed_updates: JSON.stringify(["message", "channel_post"]),
    limit: args.limit,
    offset,
    timeout: 0,
  });
  const media = updates.map(mediaFromMessage).filter(Boolean);
  const chats = new Map();

  for (const item of media) {
    chats.set(item.chatId, (chats.get(item.chatId) ?? 0) + 1);
  }

  console.log(
    `Found ${updates.length} updates and ${media.length} media items.`,
  );

  if (chats.size) {
    console.log("Media chats:");
    for (const [chatId, count] of chats) {
      console.log(`- ${chatId}: ${count} media item(s)`);
    }
  }

  const selected = importChatId
    ? media.filter((item) => item.chatId === importChatId)
    : media;

  if (!args.apply) {
    for (const item of selected) {
      console.log(
        `[dry-run] ${item.chatId} ${item.mediaType} ${item.sourceUniqueId} ${item.fileName}`,
      );
    }
    console.log(
      "Dry run only. Re-run with --apply to upload and catalog media.",
    );
    return;
  }

  const db = getDbClient();
  const workspace = await resolveWorkspace(db);
  const blobAccess = blobAccessEnv();
  const blobToken = requiredEnv("BLOB_READ_WRITE_TOKEN");
  const lastUpdateId = Math.max(
    state.lastUpdateId ?? 0,
    ...updates.map((update) => update.update_id),
  );

  for (const item of selected) {
    const result = await importMedia({
      blobAccess,
      blobToken,
      db,
      item,
      token,
      workspace,
    });
    console.log(
      `${result.action}: ${item.mediaType} ${item.sourceUniqueId} -> ${result.item.url}`,
    );
  }

  writeState({
    importedAt: new Date().toISOString(),
    lastUpdateId,
    workspaceId: workspace.id,
    workspaceSlug: workspace.slug,
  });

  console.log(`Done. Last processed update: ${lastUpdateId}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
