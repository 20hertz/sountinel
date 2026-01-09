/**
 * Sountinel - Reddit Post Monitoring System
 *
 * This Devvit app monitors a pre-determined community (e.g. r/Drumkits)
 * for new posts containing Google Drive links to drum kit sample packs.
 *
 * Architecture:
 * - Listens for PostSubmit events
 * - Extracts Google Drive links from post URLs
 * - Creates GitHub Issues with post metadata
 * - AWS Lambda polls GitHub Issues and processes them
 *
 * Settings (configured via Devvit CLI or Reddit Developer Portal):
 * - github_token: GitHub Personal Access Token (app-scoped secret)
 * - github_repo: GitHub repository (format: owner/repo)
 */

import { Devvit } from '@devvit/public-api';
import { extractSupportedLink } from './linkExtractor.js';

Devvit.configure({
  redditAPI: true,
  http: true,
});

// App settings
Devvit.addSettings([
  {
    type: 'string',
    name: 'github_token',
    label: 'GitHub Personal Access Token',
    helpText: 'Create at github.com/settings/tokens with repo scope',
    isSecret: true,
    scope: 'app',
  },
  {
    type: 'string',
    name: 'github_repo',
    label: 'GitHub Queue Repository',
    helpText: 'Format: owner/repo (e.g., 20hertz/sountinel-queue)',
    defaultValue: '20hertz/sountinel-queue',
    scope: 'installation',
  },
]);

/**
 * PostSubmit trigger - listens for new posts in the subreddit
 *
 * When a new post is submitted, this handler:
 * 1. Gets GitHub configuration from settings
 * 2. Extracts Google Drive links from post URL
 * 3. Prepares payload with post metadata
 * 4. Creates GitHub Issue with formatted body
 * 5. AWS Lambda polls issues hourly and processes them
 */
Devvit.addTrigger({
  event: 'PostSubmit',
  async onEvent(event, context) {
    try {

      // 1. Get configuration from app settings
      const githubToken = await context.settings.get<string>('github_token')
      const githubRepo = await context.settings.get<string>('github_repo')

      if (!githubToken || !githubRepo) {
        console.error('Missing GitHub configuration');
        return;
      }

      // 2. Get post details from event (post may not be available via API yet)
      const post = event.post!;

      // 3. Extract Google Drive link
      const driveLink = extractSupportedLink(post.url);
      if (!driveLink)  return;
      
      // 4. Prepare payload
      const payload = {
        postId: post.id,
        title: post.title,
        author: post.authorId,
        subreddit: post.subredditId,
        url: post.url,
        permalink: post.permalink,
        score: post.score,
        numComments: post.numComments,
        createdAt: post.createdAt,
        driveUrl: driveLink,
      };

      // 5. Create GitHub Issue
      const response = await fetch(`https://api.github.com/repos/${githubRepo}/issues`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify({
          title: `Reddit Post: ${post.id}`,
          body: `# Reddit Post from r/${post.subredditId}\n\n` +
                `**Post**: [${post.title}](https://reddit.com${post.permalink})\n` +
                `**Author**: u/${post.authorId}\n` +
                `**Drive Link**: ${driveLink}\n\n` +
                `## Payload\n\`\`\`json\n${JSON.stringify(payload, null, 2)}\n\`\`\``,
          labels: ['pending', 'sountinel'],
        }),
      });

      if (response.ok) {
        const issue = await response.json();
      } else {
        const errorText = await response.text();
        console.error(`GitHub API failed: ${response.status}`, errorText);
      }

    } catch (error) {
      console.error('Error:', error);
    }
  },
});

export default Devvit;
