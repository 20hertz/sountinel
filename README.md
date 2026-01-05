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
# Deploy to Devvit
npm run deploy

# Install to test subreddit
npx devvit install sountinel_dev
```

### Configure Settings

Settings are configured at the app level via Devvit CLI:

```bash
# Set GitHub Personal Access Token (app-scoped)
npx devvit settings set github_token --app sountinel
# Paste your token (create at github.com/settings/tokens with repo scope)

# Set GitHub repository (installation-scoped)
npx devvit settings set github_repo --subreddit sountinel_dev
# Enter: 20hertz/sountinel-queue
```

Alternatively, configure via the [Developer Portal](https://developers.reddit.com/apps/sountinel).

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
│   └── googleDriveValidator.ts # Drive ID extraction (unused in Phase 1)
├── devvit.yaml              # Devvit config (HTTP allowlist)
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

```bash
# Install to r/Drumkits
npx devvit install Drumkits

# Monitor logs
npx devvit logs Drumkits
```

## Troubleshooting

### No issues created in GitHub

Check logs for errors:
```bash
npx devvit logs sountinel_dev
```

Verify settings:
```bash
npx devvit settings list --app sountinel
npx devvit settings list --subreddit sountinel_dev
```

Common issues:
- GitHub token invalid or expired
- GitHub repo name incorrect (format: `owner/repo`)
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
