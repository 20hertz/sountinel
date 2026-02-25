# Sountinel

A Devvit app that validates links posted to r/Drumkits. Checks that shared files are publicly accessible and contain audio content.

## What It Does

When a new post is submitted to r/Drumkits:

1. **Identifies** the file host (Google Drive, Dropbox, or MediaFire)
2. **Validates accessibility** — is the link public? (no login/permission required)
3. **Checks for audio content** — does the link point to audio files or archives?
4. **Acts on the result**:
   - **Pass**: Post stays up, nothing happens
   - **Fail**: Post is removed with a sticky comment explaining why and how to fix it
   - **Error/Uncertain**: Post is reported to the mod queue for human review

Posts using unsupported file hosts are handled by AutoModerator (provider allowlist), not this app.

## Supported Providers

| Provider | Validation Method | Folders |
|----------|------------------|---------|
| Google Drive | Drive API v3 (API key) | API traversal, 1 level deep |
| Dropbox | HTTP scraping | Pass if accessible (contents not inspectable) |
| MediaFire | HTTP scraping | Pass if accessible (contents not inspectable) |

## Quick Start

### Prerequisites

- [Devvit CLI](https://developers.reddit.com/docs/get-started/quickstart/) installed
- A Google Drive API key ([create one](https://console.cloud.google.com/apis/credentials) — takes 5 minutes, no OAuth needed)
- Moderator access to a test subreddit

### Deploy

```bash
# Upload to Devvit
npm run deploy
```

### Configure the API Key

```bash
# Set the Google Drive API key (app-scoped secret)
npx devvit settings set google_drive_api_key --app sountinel
```

### Install to a Subreddit

```bash
# Install to your test subreddit
npx devvit install <subreddit_name>
```

### Test

1. Create a test post with a Google Drive / Dropbox / MediaFire link
2. Check the logs:

```bash
npx devvit logs <subreddit_name>
```

## Project Structure

```
sountinel/
  devvit.yaml              # HTTP domain allowlist for all 3 providers
  src/
    main.ts                # PostSubmit trigger → validate → remove/report
    types.ts               # ValidationResult, Provider, FailureType
    config.ts              # Audio/archive extensions, helpers
    comments.ts            # Removal comment templates + flair text
    providers/
      index.ts             # Provider detection + dispatch
      googleDrive.ts       # Google Drive API v3 validation
      dropbox.ts           # Dropbox HTTP validation
      mediafire.ts         # MediaFire HTTP validation
    __tests__/
      config.test.ts
      comments.test.ts
      providers/
        index.test.ts
```

## How Validation Works

### Google Drive
- Extracts file/folder ID from URL
- Calls Drive API v3 for metadata (name, mimeType, size)
- HTTP 403 → private link, HTTP 404 → dead link
- Single files: checks extension against audio formats
- ZIP/RAR/7z: assumed to contain audio
- Folders: lists root files, then 1 level of subfolders. No audio after traversal → mod queue (not auto-remove)

### Dropbox & MediaFire
- Fetches the shared link page via HTTP GET
- Parses HTML for error states (deleted, private, password-protected)
- Checks filename from URL path or `og:title` meta tag
- Folders: pass if accessible — file listings are JS-rendered (protobuf-based) and can't be reliably parsed without a protobuf library

### Moderation Actions

| Result | Action | Flair |
|--------|--------|-------|
| Private/login required | Remove + comment | `Needs Fix: Private Link` |
| 404 / dead link | Remove + comment | `Removed: Dead Link` |
| No audio (single file) | Remove + comment | `Removed: No Audio` |
| No audio (Google Drive folder, after traversal) | Report to mod queue | `Needs Review` |
| API timeout / error | Report to mod queue | `Needs Review` |

**Principle**: When in doubt, don't remove. Send to mod queue.

## Development

```bash
# Type check
npm run type-check

# Run tests
npm test

# Playtest locally
npm run dev

# Deploy
npm run deploy
```

## Learn More

- [Devvit Documentation](https://developers.reddit.com/docs/)
- [Developer Portal](https://developers.reddit.com/my/apps)
- [Google Drive API v3](https://developers.google.com/drive/api/v3/reference)

## License

BSD-3-Clause
