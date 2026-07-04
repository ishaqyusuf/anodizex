# ADR: Use Telegram-Only Raw Media Catalog Import

## Status
Accepted

## Context
Anodizex needs a fast way to collect raw images and videos for the website gallery before they are organized into projects, tags, captions, and milestones. The earlier local `.gallery` folder idea was dropped. The user created a Telegram bot for dumping raw media and wants the app to fetch media from that bot, upload it to Vercel Blob, and catalog it in the dashboard.

## Decision
Use Telegram bot updates as the only raw media import source. A root import script reads bot updates, filters media from `TELEGRAM_IMPORT_CHAT_ID`, downloads each Telegram file, uploads it to public Vercel Blob, and creates unassigned `WebsiteGalleryItem` records. Gallery items store Telegram source IDs, Blob pathname, captured date from the Telegram message date, and editable CMS metadata.

Imported items are idempotent by workspace, source provider, and Telegram `file_unique_id`. Dashboard users organize imported media later by editing title, description/caption, tags, date, featured state, media type, and project assignment.

## Consequences
- Raw media intake no longer depends on a local folder.
- The dashboard remains the place where media is curated and assigned to projects.
- Telegram bot tokens are sensitive production credentials and must only live in ignored env files or managed deployment env.
- A pasted bot token should be treated as exposed and regenerated before production import.
- Public Vercel Blob storage remains appropriate because imported media is intended for public website gallery/project display.

## Alternatives Considered
- Local `.gallery` import: dropped because the user wants Telegram as the media dump source.
- Dashboard-only manual upload: still supported, but too slow for bulk raw media intake.
- Import into project media directly: deferred because project organization should happen in the dashboard after cataloging.

## Date
2026-07-04
