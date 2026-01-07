# Sountinel - Reddit-to-GitHub Bridge

A Devvit app that monitors subreddit posts for Google Drive links and creates GitHub Issues with structured post metadata.

## What It Does

When a new post containing a Google Drive link is submitted to your subreddit:

1. **Detects** the post via Reddit's PostSubmit event
2. **Extracts** Google Drive URLs from the post
3. **Creates** a GitHub Issue with formatted post metadata and JSON payload

The app acts as a reliable bridge from Reddit to GitHub Issues, where you can process posts using your own automation (GitHub Actions, webhooks, polling services, etc.).

## Why Use This Pattern?

Devvit's HTTP plugin has strict allowlist restrictions - you can't directly call most external APIs (AWS, custom backends, etc.). However, GitHub's API is allowed. This app leverages that to create a simple, reliable integration point.

## Quick Start

### Deploy App

```bash
# Upload to Devvit
npm run deploy
```

### Configure Settings

Settings must be configured via the [Developer Portal](https://developers.reddit.com/apps/sountinel):

1. **GitHub Personal Access Token** (app-scoped)
   - Create at [github.com/settings/tokens](https://github.com/settings/tokens) with `repo` scope
   - Set once for all installations
   - Configure at: https://developers.reddit.com/apps/sountinel

2. **GitHub Repository** (installation-scoped)
   - Format: `owner/repo` (e.g., `20hertz/sountinel-queue`)
   - Can differ per subreddit installation
   - Configure after installation at: https://developers.reddit.com/r/SUBREDDIT/apps/sountinel

### Install to Subreddit

```bash
# Install to your test subreddit (must have <200 members for unlisted apps)
npx devvit install YOUR_SUBREDDIT_NAME
```

### Test

1. Create a test post in your subreddit with a Google Drive link
2. Check the logs:

```bash
npx devvit logs YOUR_SUBREDDIT_NAME
```

Expected output:
```
[Sountinel] New post detected: t3_xxxxx
[Sountinel] Extracted Drive link: https://drive.google.com/...
[Sountinel] ✅ Created GitHub issue #X: https://github.com/...
```

3. Verify the GitHub issue was created in your configured repository

## Development

### Local Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Type check
npm run type-check

# Deploy changes
npm run deploy
```

### Project Structure

```
sountinel/
├── src/
│   ├── main.ts              # PostSubmit handler (creates GitHub issues)
│   ├── linkExtractor.ts     # Google Drive URL extraction
│   └── __tests__/           # Unit tests
├── devvit.yaml              # Devvit config (HTTP allowlist)
├── PRIVACY.md               # Privacy policy (required for publishing)
├── TERMS.md                 # Terms & conditions (required for publishing)
└── package.json
```

## How It Works

1. **PostSubmit Trigger**: Fires when a new post is created in your subreddit
2. **Extract Drive Link**: Parses the post URL for Google Drive links
3. **Create GitHub Issue**:
   - Title: `Reddit Post: t3_xxxxx`
   - Body: Formatted markdown with post metadata + JSON payload
   - Labels: `pending`, `sountinel`
4. **Done**: The app's job is complete. Process the GitHub Issues however you want (GitHub Actions, webhooks, polling, manual review, etc.)

## Supported Google Drive URLs

- `https://drive.google.com/file/d/{id}`
- `https://drive.google.com/open?id={id}`
- `https://drive.google.com/drive/folders/{id}`
- `https://docs.google.com/document/d/{id}`
- `https://docs.google.com/spreadsheets/d/{id}`
- `https://docs.google.com/presentation/d/{id}`

Posts without Drive links are silently skipped.

## GitHub Issue Format

Each detected post creates an issue with this structure:

```markdown
# Reddit Post from r/YourSubreddit

**Post**: [Post Title](https://reddit.com/r/YourSubreddit/comments/...)
**Author**: u/username
**Drive Link**: https://drive.google.com/...

## Payload
```json
{
  "postId": "t3_xxxxx",
  "title": "Post title",
  "author": "username",
  "subreddit": "YourSubreddit",
  "url": "https://drive.google.com/...",
  "permalink": "/r/YourSubreddit/comments/...",
  "score": 42,
  "numComments": 5,
  "createdAt": 1234567890,
  "driveUrl": "https://drive.google.com/..."
}
```
```

The JSON payload can be easily parsed by automation tools for downstream processing.

## Production Deployment

### Prerequisites

Apps using the HTTP plugin require privacy policy and terms & conditions:

1. Ensure [PRIVACY.md](PRIVACY.md) and [TERMS.md](TERMS.md) are committed to GitHub
2. Add URLs to Developer Portal settings:
   - Privacy Policy: `https://raw.githubusercontent.com/20hertz/sountinel/main/PRIVACY.md`
   - Terms & Conditions: `https://raw.githubusercontent.com/20hertz/sountinel/main/TERMS.md`

### Publishing

```bash
# 1. Publish the app (makes it unlisted - installable by any moderator)
npx devvit publish

# 2. Install to your production subreddit
npx devvit install YOUR_SUBREDDIT

# 3. Configure settings via Developer Portal
# https://developers.reddit.com/r/YOUR_SUBREDDIT/apps/sountinel

# 4. Monitor logs
npx devvit logs YOUR_SUBREDDIT
```

## Troubleshooting

### No issues created in GitHub

Check logs for errors:
```bash
npx devvit logs YOUR_SUBREDDIT
```

Verify settings via Developer Portal:
- App settings: https://developers.reddit.com/apps/sountinel
- Installation settings: https://developers.reddit.com/r/YOUR_SUBREDDIT/apps/sountinel

Common issues:
- GitHub token invalid or expired (check token has `repo` scope)
- GitHub repo name incorrect (format: `owner/repo`)
- Settings not configured via Developer Portal
- Post URL doesn't contain Google Drive link

### GitHub API errors

- Verify token has `repo` scope
- Check rate limits: 5,000 requests/hour for authenticated requests
- Test token manually: `curl -H "Authorization: Bearer $TOKEN" https://api.github.com/user`

## Use Cases

- **Content Curation**: Collect and process user-submitted content links
- **Moderation Queues**: Review flagged posts in a structured format
- **Archival**: Store subreddit activity with metadata
- **Integration**: Bridge Reddit posts to external systems via GitHub webhooks/actions
- **Analytics**: Process post data for insights and reporting

## Learn More

- [Devvit Documentation](https://developers.reddit.com/docs/)
- [Developer Portal](https://developers.reddit.com/my/apps)
- [GitHub Issues API](https://docs.github.com/en/rest/issues/issues)

## License

MIT
