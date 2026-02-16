import { Devvit } from '@devvit/public-api';
import { identifyProvider, validateLink } from './providers/index.js';
import { buildComment, getFlairText } from './comments.js';

Devvit.configure({
  redditAPI: true,
  http: {
    domains: [
      'www.googleapis.com',
      'www.dropbox.com',
      'dropbox.com',
      'dl.dropboxusercontent.com',
      'www.mediafire.com',
      'mediafire.com',
      'download.mediafire.com',
    ],
  },
});

Devvit.addSettings([
  {
    type: 'string',
    name: 'github_token',
    label: 'Google Drive API Key',
    helpText: 'API key for Google Drive v3 API (reuses github_token key due to Devvit settings bug)',
    isSecret: true,
    scope: 'app',
  },
]);

Devvit.addTrigger({
  event: 'PostSubmit',
  async onEvent(event, context) {
    console.log('[Sountinel] PostSubmit trigger fired');
    const post = event.post;
    console.log(`[Sountinel] post.url = ${post?.url ?? '(none)'}`);
    if (!post?.url) return;

    const provider = identifyProvider(post.url);
    console.log(`[Sountinel] provider = ${provider ?? '(none)'}`);
    if (!provider) return;

    const apiKey = await context.settings.get<string>('github_token');
    console.log(`[Sountinel] apiKey present = ${!!apiKey}`);

    try {
      const result = await validateLink(provider, post.url, apiKey ?? undefined);
      console.log(`[Sountinel] result: status=${result.status}, failureType=${result.failureType ?? 'none'}, message=${result.message ?? 'OK'}`);

      if (result.status === 'PASS') return;

      const subredditName = await context.reddit.getCurrentSubredditName();

      if (result.status === 'ERROR') {
        // Don't remove — report to mod queue for human review
        const postObj = await context.reddit.getPostById(post.id);
        const reason = `Sountinel: ${result.message ?? 'needs review'}`.slice(0, 100);
        await context.reddit.report(postObj, { reason });
        if (result.failureType) {
          await context.reddit.setPostFlair({
            subredditName,
            postId: post.id,
            text: getFlairText(result.failureType, provider),
          });
        }
        return;
      }

      // FAIL — remove post, add sticky comment, set flair
      await context.reddit.remove(post.id, false);

      const comment = await context.reddit.submitComment({
        id: post.id,
        text: buildComment(result.failureType!, provider, post.url),
      });
      await comment.distinguish(true); // true = make sticky

      await context.reddit.setPostFlair({
        subredditName,
        postId: post.id,
        text: getFlairText(result.failureType!, provider),
      });
    } catch (error) {
      console.error(`Sountinel validation error for ${post.url}:`, error);
    }
  },
});

export default Devvit;
