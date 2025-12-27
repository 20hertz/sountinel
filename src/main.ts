/**
 * Sountinel - Reddit Post Monitoring System
 *
 * This Devvit app monitors r/Drumkits (and r/sound_sentinel_dev for testing)
 * for new posts containing Google Drive links to drum kit sample packs.
 *
 * Architecture:
 * - Listens for PostSubmit events
 * - Extracts Google Drive links from post URLs
 * - Sends post metadata to AWS API Gateway via HMAC-signed webhooks
 * - AWS Lambda processes and stores posts in DynamoDB
 *
 * Environment Variables (configured via Devvit settings):
 * - aws_api_endpoint: API Gateway endpoint URL
 * - hmac_secret: HMAC shared secret for request signing
 */

import { Devvit } from '@devvit/public-api';
import { signRequest } from './hmac.js';
import { extractSupportedLink } from './linkExtractor.js';
import { extractGoogleDriveId } from './googleDriveValidator.js';

Devvit.configure({
  redditAPI: true,
  http: true, // Required for webhook API calls
});

// App settings
Devvit.addSettings([
  {
    type: 'string',
    name: 'aws_api_endpoint',
    label: 'AWS API Gateway Endpoint',
    defaultValue: 'https://axp7cyasld.execute-api.ca-central-1.amazonaws.com/webhook/reddit-post',
    scope: 'installation',
  },
  {
    type: 'string',
    name: 'hmac_secret',
    label: 'HMAC Shared Secret',
    isSecret: true,
    scope: 'app',
  },
]);

/**
 * PostSubmit trigger - listens for new posts in the subreddit
 *
 * This is the main entry point for the monitoring system. When a new post
 * is submitted, this handler:
 * 1. Gets AWS API endpoint and HMAC secret from settings
 * 2. Extracts Google Drive links from post URL
 * 3. Prepares payload with post metadata
 * 4. Signs payload with HMAC-SHA256
 * 5. Sends signed webhook to AWS API Gateway
 * 6. AWS Lambda validates signature and stores in DynamoDB
 */
Devvit.addTrigger({
  event: 'PostSubmit',
  async onEvent(event, context) {
    try {
      console.log(`[Sountinel] New post detected: ${event.post?.id}`);

      // 1. Get configuration from app settings
      const apiEndpoint = await context.settings.get('aws_api_endpoint') as string;
      const hmacSecret = await context.settings.get('hmac_secret') as string;

      if (!hmacSecret || !apiEndpoint) {
        console.error('[Sountinel] Missing configuration: HMAC secret or API endpoint not set');
        console.error('[Sountinel] Configure via: https://developers.reddit.com/apps/sountinel');
        return;
      }

      // 2. Get post details
      const post = await context.reddit.getPostById(event.post!.id);

      // 3. Extract Google Drive link
      const driveLink = extractSupportedLink(post.url);
      if (!driveLink) {
        console.log(`[Sountinel] Post ${post.id} has no supported Google Drive link - skipping`);
        return;
      }

      console.log(`[Sountinel] Extracted Drive link: ${driveLink}`);

      // 4. Prepare payload
      const payload = {
        postId: post.id,
        title: post.title,
        author: post.authorName || '[deleted]',
        subreddit: post.subredditName,
        url: post.url,
        permalink: post.permalink,
        score: post.score,
        numComments: post.numberOfComments,
        createdAt: Math.floor(post.createdAt.getTime() / 1000),
        driveUrl: driveLink,
      };

      console.log(`[Sountinel] Prepared payload for post ${post.id}`);

      // 5. Sign request with HMAC
      const { timestamp, signature } = signRequest(payload, hmacSecret);
      console.log(`[Sountinel] Generated HMAC signature for timestamp ${timestamp}`);

      // 6. Send to AWS API Gateway
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Timestamp': timestamp,
          'X-Signature': signature,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`[Sountinel] ✅ Successfully processed post ${post.id}:`, JSON.stringify(result));
      } else {
        const errorText = await response.text();
        console.error(`[Sountinel] ❌ API request failed: ${response.status} ${response.statusText}`);
        console.error(`[Sountinel] Error details: ${errorText}`);
      }

    } catch (error) {
      console.error('[Sountinel] ❌ Error processing post:', error);
      // Don't throw - we don't want to break the subreddit if our monitoring fails
    }
  },
});

export default Devvit;
