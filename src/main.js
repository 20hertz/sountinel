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
import { extractSupportedLink } from './linkExtractor.js';
import { extractGoogleDriveId } from './googleDriveValidator.js';
Devvit.configure({
    redditAPI: true,
    http: true, // Required for webhook API calls
});
/**
 * PostSubmit trigger - listens for new posts in the subreddit
 *
 * This is the main entry point for the monitoring system. When a new post
 * is submitted, this handler:
 * 1. Extracts the post URL
 * 2. Checks if it contains a Google Drive link
 * 3. Logs the post for monitoring
 *
 * TODO Phase 2, Days 2-3: Implement HMAC signing and webhook posting to AWS
 */
Devvit.addTrigger({
    event: 'PostSubmit',
    async onEvent(event, context) {
        try {
            console.log(`[Sountinel] New post detected: ${event.post?.id}`);
            // 1. Extract post metadata
            const postId = event.post?.id;
            if (!postId) {
                console.error('[Sountinel] No post ID in event');
                return;
            }
            const post = await context.reddit.getPostById(postId);
            const postUrl = post.url;
            console.log(`[Sountinel] Post URL: ${postUrl}`);
            // 2. Extract Google Drive link
            const driveLink = extractSupportedLink(postUrl);
            if (!driveLink) {
                console.log(`[Sountinel] Post ${post.id} has no supported Google Drive link - skipping`);
                return;
            }
            console.log(`[Sountinel] Extracted Drive link: ${driveLink}`);
            // 3. Extract Drive ID
            const driveId = extractGoogleDriveId(driveLink);
            if (!driveId) {
                console.warn(`[Sountinel] Could not extract Drive ID from: ${driveLink}`);
            }
            console.log(`[Sountinel] Post ${post.id} ready for webhook processing`);
            console.log(`[Sountinel] TODO Phase 2: Sign and send to AWS API Gateway`);
        }
        catch (error) {
            console.error('[Sountinel] Error processing post:', error);
            // Don't throw - we don't want to break the subreddit if our monitoring fails
        }
    },
});
export default Devvit;
