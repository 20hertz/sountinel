# Deployment Checklist for Sountinel

## ✅ Completed

### 1. Architecture Decision
- ✅ Chose Full TypeScript approach (no Python/Lambda)
- ✅ Devvit PostSubmit → AWS DynamoDB architecture
- ✅ Region: ca-central-1
- ✅ DynamoDB for permanent storage (not Devvit Redis)

### 2. Code Implementation
- ✅ Ported GoogleDriveValidator from Python to TypeScript (348 lines)
- ✅ Ported link extraction logic (62 lines)
- ✅ Implemented Devvit PostSubmit handler (225 lines)
- ✅ AWS SDK configured for DynamoDB writes
- ✅ Triple-layer deduplication (pre-check + partition key + ConditionExpression)
- ✅ 50 tests passing (35 link extraction + 15 validator)

### 3. Configuration Updates
- ✅ Updated Devvit app to use ca-central-1
- ✅ Updated CDK stack to use ca-central-1
- ✅ Removed Python Lambda from CDK (DynamoDB-only deployment)
- ✅ Fixed deprecation warning (pointInTimeRecoverySpecification)
- ✅ CDK synthesis works without Docker ✓

### 4. Documentation
- ✅ Created IAM_SETUP_GUIDE.md (step-by-step IAM user creation)
- ✅ Created DEPLOYMENT.md (full deployment guide)
- ✅ Created IMPLEMENTATION_SUMMARY.md (technical details)
- ✅ This checklist

---

## 🚀 Next Steps (Your Tasks)

### Step 1: Create IAM User (15 minutes)

**Follow**: `/sountinel/IAM_SETUP_GUIDE.md`

**Option 2 (Traditional IAM User)** is recommended for easier Devvit integration.

**What you'll create:**
- IAM User: `devvit-reddit-monitor`
- Policy: DynamoDB read/write on `boomtap-reddit-posts` table only
- Access Key: AKIA... (programmatic access)
- Secret Key: wJa... (save this!)

**Save credentials temporarily** - you'll need them in Step 3.

---

### Step 2: Deploy DynamoDB Table (5 minutes)

```bash
cd /Users/stephane/Dev/boomtap/reddit-monitor

# Deploy DynamoDB table to ca-central-1
npm run deploy -- --profile boomtap-prod
```

**Expected output:**
```
✅ RedditMonitorStack

Outputs:
RedditMonitorStack.TableArn = arn:aws:dynamodb:ca-central-1:...
RedditMonitorStack.TableName = boomtap-reddit-posts
```

**Verify table created:**
```bash
aws dynamodb describe-table \
  --table-name boomtap-reddit-posts \
  --region ca-central-1 \
  --profile boomtap-prod
```

---

### Step 3: Configure Devvit Secrets (5 minutes)

```bash
cd /Users/stephane/Dev/boomtap/sountinel

# Login to Devvit (if not already)
npm run login

# Add AWS credentials from Step 1
devvit secrets add AWS_ACCESS_KEY_ID
# Paste: AKIA... (from IAM user creation)

devvit secrets add AWS_SECRET_ACCESS_KEY
# Paste: wJa... (from IAM user creation)

# Verify secrets added
devvit secrets list
```

**Expected output:**
```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
```

---

### Step 4: Deploy Devvit App to Test Subreddit (5 minutes)

```bash
cd /Users/stephane/Dev/boomtap/sountinel

# Upload app to Devvit
npm run deploy

# Install to test subreddit
devvit install sound_sentinel_dev
```

**Expected output:**
```
✅ Successfully uploaded sountinel
✅ Successfully installed sountinel on r/sound_sentinel_dev
```

---

### Step 5: End-to-End Test (10 minutes)

#### 5.1 Create Test Post

1. Go to https://reddit.com/r/sound_sentinel_dev
2. Create a new post:
   - Title: `Test - Sample Pack`
   - URL: `https://drive.google.com/file/d/1abc123/view` (any Google Drive link)
3. Submit post

#### 5.2 Monitor Devvit Logs

```bash
devvit logs sound_sentinel_dev
```

**Look for:**
```
✅ New post detected: abc123
✅ Extracted Drive link: https://drive.google.com/...
✅ Writing post to DynamoDB...
✅ Successfully wrote post abc123 to DynamoDB
```

**If you see errors**, check:
- AWS credentials correct? (`devvit secrets list`)
- DynamoDB table exists? (`aws dynamodb describe-table...`)
- Region correct? (ca-central-1)

#### 5.3 Verify DynamoDB Entry

```bash
# Get the post ID from Devvit logs (e.g., "abc123")
aws dynamodb get-item \
  --table-name boomtap-reddit-posts \
  --key '{"reddit_post_id": {"S": "POST_ID_HERE"}}' \
  --region ca-central-1 \
  --profile boomtap-prod
```

**Expected output:**
```json
{
  "Item": {
    "reddit_post_id": {"S": "abc123"},
    "reddit_title": {"S": "Test - Sample Pack"},
    "drive_url": {"S": "https://drive.google.com/..."},
    "validation_status": {"S": "pending"},
    "created_utc": {"N": "1702512345"},
    ...
  }
}
```

#### 5.4 Test Deduplication

1. Create the **same post again** in r/sound_sentinel_dev (same Google Drive link)
2. Check Devvit logs:
   ```
   ✅ Post abc123 already exists - duplicate prevented
   ```
3. Verify only ONE entry in DynamoDB (not two)

---

### Step 6: Deploy to Production (After Testing Passes)

```bash
# Install to r/Drumkits (production)
devvit install Drumkits
```

**Monitor first few posts:**
```bash
devvit logs Drumkits
```

---

## 🧪 Testing Scenarios

Before deploying to r/Drumkits, test these scenarios in r/sound_sentinel_dev:

- ✅ Post with valid Google Drive file link
- ✅ Post with valid Google Drive folder link
- ✅ Post with Google Docs/Sheets/Slides link
- ✅ Post with invalid/non-Google Drive URL (should be ignored)
- ✅ Duplicate post (should prevent duplicate DB entry)
- ✅ Post with no URL (should be ignored)

---

## 📊 Monitoring

### Check DynamoDB Posts

```bash
# List all posts
aws dynamodb scan \
  --table-name boomtap-reddit-posts \
  --region ca-central-1 \
  --profile boomtap-prod \
  --max-items 10
```

### Check Devvit Logs

```bash
# Real-time logs
devvit logs sound_sentinel_dev

# Or for production
devvit logs Drumkits
```

### Check AWS Costs

- DynamoDB On-Demand: ~$1.44/month (30 posts/month)
- CloudWatch Logs: ~$0.50/month
- **Total: ~$2/month**

---

## 🔧 Troubleshooting

### Error: "Access Denied" when writing to DynamoDB

**Cause**: IAM policy not correct or credentials wrong

**Fix:**
1. Verify IAM policy includes `dynamodb:PutItem`
2. Check credentials: `devvit secrets list`
3. Test credentials with AWS CLI (see IAM_SETUP_GUIDE.md)

### Error: "Table not found"

**Cause**: DynamoDB table not deployed or wrong region

**Fix:**
1. Check table exists: `aws dynamodb list-tables --region ca-central-1`
2. Verify region in main.ts is `ca-central-1`

### No logs appearing

**Cause**: App not installed or not triggering

**Fix:**
1. Verify installation: `devvit installations list`
2. Check PostSubmit trigger is enabled in main.ts
3. Try creating a test post

### Posts not appearing in DynamoDB

**Cause**: URL might not be Google Drive, or extraction failing

**Fix:**
1. Check Devvit logs for "No supported Google Drive link" message
2. Verify URL format matches extraction patterns
3. Test with known working Google Drive URL

---

## 📁 File Structure

```
/sountinel/
├── src/
│   ├── main.ts                          # PostSubmit handler ✓
│   ├── linkExtractor.ts                 # URL extraction ✓
│   ├── googleDriveValidator.ts          # Drive validation ✓
│   └── __tests__/
│       ├── linkExtractor.test.ts        # 35 tests ✓
│       └── googleDriveValidator.test.ts # 15 tests ✓
├── IAM_SETUP_GUIDE.md                   # This guide ✓
├── DEPLOYMENT.md                        # Full deployment guide ✓
├── DEPLOYMENT_CHECKLIST.md              # This checklist ✓
└── package.json                         # Dependencies ✓

/reddit-monitor/
├── lib/reddit-monitor-stack.ts          # DynamoDB CDK stack ✓
├── bin/reddit-monitor.ts                # ca-central-1 config ✓
└── package.json                         # CDK dependencies ✓
```

---

## ✅ Success Criteria

Before deploying to r/Drumkits, verify:

- [ ] IAM user created with minimal permissions
- [ ] DynamoDB table deployed to ca-central-1
- [ ] Devvit secrets configured
- [ ] App deployed to r/sound_sentinel_dev
- [ ] Test post creates DynamoDB entry
- [ ] Deduplication works (duplicate post prevented)
- [ ] Invalid URLs ignored (no errors in logs)
- [ ] All 50 tests passing

---

## 🎯 Current Status

**Location**: Step 1 (Create IAM User)

**Estimated time to production**: ~40 minutes

**Next action**: Follow `IAM_SETUP_GUIDE.md` to create the IAM user

---

**Questions?** Check:
- IAM_SETUP_GUIDE.md - IAM user creation
- DEPLOYMENT.md - Full technical details
- IMPLEMENTATION_SUMMARY.md - Code architecture
