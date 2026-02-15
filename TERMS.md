# Terms and Conditions for Sountinel

**Last Updated**: February 13, 2026

## Acceptance of Terms

By installing or using Sountinel in your subreddit, you agree to these Terms and Conditions. If you do not agree, do not install or use Sountinel.

## What Sountinel Does

Sountinel is a Reddit moderation bot that:

1. Monitors posts in configured subreddits for file-sharing links (Google Drive, Dropbox, MediaFire)
2. Validates that links are publicly accessible (no login or permission required)
3. Checks that links point to audio content (audio files or archives)
4. Removes posts that fail validation, with a comment explaining the issue and how to fix it
5. Reports ambiguous cases to the mod queue for human review

## How Sountinel Works

1. **Post Monitoring**: Listens for new posts via Reddit's PostSubmit event
2. **Link Detection**: Identifies Google Drive, Dropbox, and MediaFire links in post URLs
3. **Validation**: Checks link accessibility via provider APIs or HTTP requests
4. **Audio Check**: Verifies the linked content is audio files or archives
5. **Moderation Action**: Removes invalid posts with an explanation, or reports uncertain cases to the mod queue

## Data Usage

### What We Access
- Public Reddit post data (title, URL, author, subreddit)
- File metadata from Google Drive API (file name, type, size — not file contents)
- HTML page content from Dropbox and MediaFire shared links (for accessibility checks)

### What We Do NOT Access
- Private messages or comments
- User account information beyond public usernames
- File contents (we never download files)
- Deleted or removed posts (after deletion)

See our [Privacy Policy](PRIVACY.md) for detailed information.

## User Responsibilities

If you post to a subreddit using Sountinel:

- **Public Links**: Ensure your file-sharing links are publicly accessible
- **Audio Content**: Links should point to audio files or archives containing audio
- **Content Ownership**: You must own or have permission to share linked content
- **Copyright**: You are responsible for ensuring shared content does not violate copyright

## Subreddit Moderator Rights

Subreddit moderators can:

- Request removal of Sountinel from their subreddit at any time
- Override Sountinel's moderation decisions (approve removed posts, etc.)
- Configure Sountinel settings via the Reddit Developer Portal

## Service Availability

Sountinel is provided "AS IS" without warranties:

- **No Uptime Guarantee**: We do not guarantee 24/7 availability
- **Validation Limits**: Validation depends on third-party APIs (Google, Dropbox, MediaFire) which may be unavailable
- **Service Changes**: We may modify or discontinue features at any time
- **False Positives**: Sountinel may occasionally remove valid posts or miss invalid ones

## Limitations of Liability

We are NOT responsible for:

- Availability or accessibility of file-sharing links
- Content of linked files
- Copyright violations in linked content
- Incorrect moderation actions (false positives or false negatives)
- Data loss or corruption
- Any damages arising from use of Sountinel

## Third-Party Services

Sountinel integrates with:

- **Reddit**: Subject to Reddit's Terms of Service and API Terms
- **Google Drive API**: Used for file metadata validation (subject to Google's Terms)
- **Dropbox**: Shared link pages are accessed for validation (subject to Dropbox's Terms)
- **MediaFire**: Shared link pages are accessed for validation (subject to MediaFire's Terms)

## Intellectual Property

### Our Rights
- The Sountinel code and platform are proprietary
- The Boomtap brand and trademarks are owned by 20Hertz

### Your Rights
- You retain all rights to content you post on Reddit
- Sountinel does not index, store, or redistribute your content

## Termination

We reserve the right to:

- Suspend or terminate Sountinel at any time
- Block specific users or subreddits

You may:

- Stop using Sountinel by uninstalling it from your subreddit

## Changes to Terms

We may update these Terms and Conditions at any time:

- Changes will be posted to this page with an updated date
- Continued use after changes constitutes acceptance

## Governing Law

These terms are governed by the laws of Canada, without regard to conflict of law provisions.

## Dispute Resolution

Any disputes will be resolved through:

1. Good faith negotiation
2. Mediation (if negotiation fails)
3. Binding arbitration in Canada (if mediation fails)

## Contact

For questions, concerns, or requests:

- **Email**: contact@boomtap.app
- **GitHub Issues**: https://github.com/20hertz/sountinel/issues
- **Developer Portal**: https://developers.reddit.com/apps/sountinel

---

**Effective Date**: February 13, 2026

**Sountinel** is developed and maintained by 20Hertz.
