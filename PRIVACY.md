# Privacy Policy for Sountinel

**Last Updated**: February 13, 2026

## Overview

Sountinel is a Reddit moderation bot that validates file-sharing links posted to configured subreddits. It checks that links are publicly accessible and contain audio content. This privacy policy explains what data we access and how we use it.

## What Data We Access

Sountinel accesses the following **public** data during validation:

- Reddit post URLs (Google Drive, Dropbox, MediaFire links)
- Reddit post IDs and titles
- Post author usernames (public Reddit usernames)
- Subreddit names

From third-party providers, Sountinel accesses:
- **Google Drive**: File/folder metadata (name, type, size) via the Drive API v3. We never download file contents.
- **Dropbox**: Shared link page HTML (to check accessibility and filename). We do not use Dropbox API credentials.
- **MediaFire**: Shared link page HTML (to check accessibility and filename). We do not use MediaFire API credentials.

## What We Do NOT Access or Store

- Private messages or comments
- User email addresses or IP addresses
- File contents (we never download files — only metadata)
- Deleted or removed posts (after deletion)
- Location data
- Any non-public Reddit data

## Data Storage

**Sountinel does not store any data.** Validation is performed in real-time during the PostSubmit event. No post data, URLs, or validation results are persisted after the event handler completes.

There is no database, no cache, and no external storage.

## Data Sharing

We do NOT:
- Sell data to third parties
- Share data with advertisers
- Use data for purposes beyond real-time link validation

## Third-Party Services

Sountinel communicates with the following services during validation:

- **Reddit API**: To perform moderation actions (remove posts, add comments, set flair, report to mod queue)
- **Google Drive API**: To check file/folder metadata (governed by Google's Privacy Policy)
- **Dropbox** (www.dropbox.com): To check shared link accessibility
- **MediaFire** (www.mediafire.com): To check shared link accessibility

No data is sent to any other service.

## Your Rights

Since Sountinel does not store any data:
- There is nothing to delete or export
- Validation happens in real-time and is not retained

If your post is incorrectly removed by Sountinel:
- The removal comment includes instructions to message the moderators
- Moderators can approve the post to override Sountinel's decision

## Children's Privacy

Sountinel does not knowingly collect or process data from children under 13. The service is intended for use by adults.

## Changes to This Policy

We may update this privacy policy from time to time. Changes will be posted to this page with an updated "Last Updated" date.

## Contact

For privacy-related questions:

- Email: contact@boomtap.app
- GitHub: https://github.com/20hertz/sountinel/issues

## Compliance

This privacy policy complies with:
- Reddit's Developer Terms
- General Data Protection Regulation (GDPR) principles
- California Consumer Privacy Act (CCPA) principles
