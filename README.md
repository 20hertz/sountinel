# Sountinel - Reddit Post Monitor

Devvit app that monitors r/Drumkits for posts containing Google Drive links to drum kit sample packs.

## Architecture

**GitHub Bridge Pattern:**
```
Reddit → Devvit PostSubmit → GitHub Issues → AWS Lambda (polling) → DynamoDB
```

- **Devvit** creates GitHub Issues with post metadata
- **AWS Lambda** polls GitHub Issues every hour
- **DynamoDB** stores processed posts

This architecture solves Devvit's HTTP allowlist restrictions (AWS endpoints blocked, but GitHub API is allowed).

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

### Install to Test Subreddit

```bash
# Create a small test subreddit first (<200 members for private apps)
npx devvit install sountinel_dev
```

### Test

Create a test post in r/sountinel_dev with a Google Drive link:
- Example: `https://drive.google.com/file/d/1ABC123/view`

Check logs:
```bash
npx devvit logs sountinel_dev
```

Expected output:
```
[Sountinel] New post detected: t3_xxxxx
[Sountinel] Extracted Drive link: https://drive.google.com/...
[Sountinel] ✅ Created GitHub issue #X: https://github.com/...
```

Verify the GitHub issue was created at: https://github.com/20hertz/sountinel-queue/issues

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

1. **PostSubmit Trigger**: Fires when new post created in r/Drumkits
2. **Extract Drive Link**: Parses post URL for Google Drive links
3. **Create GitHub Issue**:
   - Title: `Reddit Post: t3_xxxxx`
   - Body: Formatted markdown with post metadata + JSON payload
   - Labels: `pending`, `sountinel`
4. **AWS Lambda** (separate project): Polls issues hourly and processes them

## Supported Google Drive URLs

- `https://drive.google.com/file/d/{id}`
- `https://drive.google.com/open?id={id}`
- `https://drive.google.com/drive/folders/{id}`
- `https://docs.google.com/document/d/{id}`
- `https://docs.google.com/spreadsheets/d/{id}`
- `https://docs.google.com/presentation/d/{id}`

Posts without Drive links are silently skipped.

## GitHub Issue Format

```markdown
# Reddit Post from r/Drumkits

**Post**: [Title](https://reddit.com/r/Drumkits/comments/...)
**Author**: u/username
**Drive Link**: https://drive.google.com/...

## Payload
```json
{
  "postId": "t3_xxxxx",
  "title": "Post title",
  "author": "username",
  "subreddit": "Drumkits",
  "url": "https://drive.google.com/...",
  "permalink": "/r/Drumkits/comments/...",
  "score": 42,
  "numComments": 5,
  "createdAt": 1234567890,
  "driveUrl": "https://drive.google.com/..."
}
```
```

## Production Deployment

### Prerequisites

Apps using the HTTP plugin require privacy policy and terms & conditions:

1. Ensure [PRIVACY.md](PRIVACY.md) and [TERMS.md](TERMS.md) are committed to GitHub
2. Add URLs to Developer Portal settings:
   - Privacy Policy: `https://raw.githubusercontent.com/20hertz/sountinel/main/PRIVACY.md`
   - Terms & Conditions: `https://raw.githubusercontent.com/20hertz/sountinel/main/TERMS.md`

### Publishing

```bash
# 1. Publish the app
npx devvit publish

# 2. Wait for Reddit approval (can take several days)

# 3. Install to r/Drumkits (after approval)
npx devvit install Drumkits

# 4. Configure settings via Developer Portal
# https://developers.reddit.com/r/Drumkits/apps/sountinel

# 5. Monitor logs
npx devvit logs Drumkits
```

## Troubleshooting

### No issues created in GitHub

Check logs for errors:
```bash
npx devvit logs sountinel_dev
```

Verify settings via Developer Portal:
- App settings: https://developers.reddit.com/apps/sountinel
- Installation settings: https://developers.reddit.com/r/sountinel_dev/apps/sountinel

Common issues:
- GitHub token invalid or expired (check token has `repo` scope)
- GitHub repo name incorrect (format: `owner/repo`)
- Settings not configured via Developer Portal
- Post URL doesn't contain Google Drive link

### GitHub API errors

- Verify token has `repo` scope
- Check rate limits: 5,000 requests/hour (we use ~4/hour)
- Test token manually: `curl -H "Authorization: Bearer $TOKEN" https://api.github.com/user`

## Related Projects

- **reddit-monitor**: AWS Lambda poller (processes GitHub Issues)
- **boomtap-planning**: Task planning and architecture docs

## Learn More

- [Devvit Documentation](https://developers.reddit.com/docs/)
- [Developer Portal](https://developers.reddit.com/my/apps)
- [Implementation Plan](../boomtap-planning/tasks/reddit-monitor-github-bridge-implementation.md)
