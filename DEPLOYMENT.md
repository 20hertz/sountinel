# Sound Sentinel Deployment Guide

This guide covers deploying the Sound Sentinel Devvit app to Reddit.

## Prerequisites

1. **Devvit CLI**: Install and login
   ```bash
   npm install -g devvit
   devvit login
   ```

2. **AWS Credentials**: Get from your AWS profile `~/.aws/credentials` under `[boomtap-prod]`
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`

3. **DynamoDB Table**: Ensure `boomtap-reddit-posts` table exists in `us-east-1`

## Deployment Steps

### Step 1: Configure Secrets (One-time setup)

Before deploying, you must configure secrets in Devvit. These are stored securely and injected as environment variables.

```bash
# Add AWS credentials
devvit secrets add AWS_ACCESS_KEY_ID
# Enter your AWS access key when prompted

devvit secrets add AWS_SECRET_ACCESS_KEY
# Enter your AWS secret access key when prompted

# Optional: Add Google Drive API key for Phase 2 validation
devvit secrets add GOOGLE_DRIVE_API_KEY
# Enter your Google Drive API key when prompted
```

Verify secrets:
```bash
devvit secrets list
```

### Step 2: Deploy to Test Subreddit (r/sound_sentinel_dev)

```bash
# Build and upload the app
npm run deploy

# Install to test subreddit
devvit install --subreddit sound_sentinel_dev
```

### Step 3: Monitor Logs

```bash
# View real-time logs
devvit logs sound_sentinel_dev

# Or view logs in browser
devvit playtest sound_sentinel_dev
```

### Step 4: Test with a Post

1. Create a test post in r/sound_sentinel_dev with a Google Drive link:
   - Example: https://drive.google.com/file/d/1ABC123xyz/view

2. Check the logs for processing:
   ```
   [Sound Sentinel] New post detected: abc123
   [Sound Sentinel] Extracted Drive link: https://drive.google.com/...
   [Sound Sentinel] Successfully indexed post abc123
   ```

3. Verify DynamoDB entry:
   ```bash
   aws dynamodb get-item \
     --table-name boomtap-reddit-posts \
     --key '{"reddit_post_id": {"S": "abc123"}}' \
     --profile boomtap-prod
   ```

### Step 5: Deploy to Production (r/Drumkits)

Once testing is complete:

```bash
# Install to production subreddit
devvit install --subreddit Drumkits
```

## Troubleshooting

### "No post detected" in logs
- Check that the app is properly installed: `devvit list`
- Verify PostSubmit trigger is registered

### DynamoDB connection errors
- Verify AWS credentials are set: `devvit secrets list`
- Check IAM permissions for DynamoDB access
- Confirm table exists: `aws dynamodb describe-table --table-name boomtap-reddit-posts --profile boomtap-prod`

### Posts not being indexed
- Check logs for errors: `devvit logs sound_sentinel_dev`
- Verify post URL contains a Google Drive link
- Ensure post is not a duplicate (check DynamoDB)

### Type errors during build
- Run `npm run type-check` to identify issues
- Ensure all dependencies are installed: `npm install`

## Local Development

For local testing without deploying:

1. Create `.env` file (see `.env.example`)
2. Run playtest mode:
   ```bash
   npm run dev
   ```

## Monitoring

Monitor the app in production:

1. **Reddit Logs**: `devvit logs Drumkits`
2. **DynamoDB Console**: Check item count and recent entries
3. **CloudWatch**: Monitor AWS Lambda (if using separate validator)

## Updating the App

When you make code changes:

```bash
# Run tests
npm test

# Type check
npm run type-check

# Deploy update
npm run deploy

# Update installation (if needed)
devvit install --subreddit sound_sentinel_dev
```

## Uninstalling

To remove the app from a subreddit:

```bash
devvit uninstall --subreddit sound_sentinel_dev
```

## Architecture Notes

### Current Implementation (Phase 1)
- **Event**: PostSubmit trigger on new Reddit posts
- **Processing**: Extract Google Drive links, write to DynamoDB with status='pending'
- **Validation**: Deferred to Phase 2

### Phase 2 (Planned)
- Async Google Drive validation
- Update validation_status in DynamoDB
- Integration with Boomtap.app frontend

## Security Considerations

1. **Secrets Management**: AWS credentials stored in Devvit secrets (encrypted)
2. **DynamoDB Access**: Use IAM role with least privilege
3. **Error Handling**: Fail-closed approach (skip post on error, don't crash)
4. **Rate Limiting**: Reddit API handled by Devvit automatically

## Support

For issues or questions:
- Check logs: `devvit logs <subreddit>`
- Review DynamoDB items for debugging
- Consult `/Users/stephane/Dev/boomtap/boomtap-planning/tasks/` for context
