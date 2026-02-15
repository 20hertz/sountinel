import type { FailureType, Provider } from './types.js';

const PROVIDER_NAMES: Record<Provider, string> = {
  google_drive: 'Google Drive',
  dropbox: 'Dropbox',
  mediafire: 'MediaFire',
};

const SHARING_INSTRUCTIONS: Record<Provider, string> = {
  google_drive:
    "Open your file/folder in Google Drive → Click **Share** → Change access to **Anyone with the link** → Set to **Viewer**.",
  dropbox:
    "Open your file in Dropbox → Click **Share** → Click **Create link** → Make sure **Anyone with the link** can view.",
  mediafire:
    "Check that your file is not set to private in your MediaFire settings.",
};

const FOOTER =
  '\n\n*This check was performed automatically by Sountinel. ' +
  'If you believe this is an error, please [message the mods]' +
  '(https://www.reddit.com/message/compose?to=/r/Drumkits).*';

export function buildComment(
  failureType: FailureType,
  provider: Provider,
  url: string,
): string {
  const name = PROVIDER_NAMES[provider];

  switch (failureType) {
    case 'PRIVATE_LINK':
      return (
        `Your post has been removed because the link is **not publicly accessible**.\n\n` +
        `Your ${name} link requires login or permission to access. ` +
        `On r/Drumkits, all links must be accessible to anyone without signing in.\n\n` +
        `**How to fix:**\n${SHARING_INSTRUCTIONS[provider]}\n\n` +
        `Once your link is public, you're welcome to resubmit.` +
        FOOTER
      );

    case 'INVALID_LINK':
      if (provider === 'google_drive') {
        return (
          `Your post has been removed because the link is **not accessible**.\n\n` +
          `This usually means the file/folder is **private** or has been **deleted**. ` +
          `On r/Drumkits, all links must be accessible to anyone without signing in.\n\n` +
          `**How to fix if the file exists:**\n${SHARING_INSTRUCTIONS[provider]}\n\n` +
          `Once your link is public, you're welcome to resubmit.` +
          FOOTER
        );
      }
      return (
        `Your post has been removed because the link appears to be **broken or deleted**.\n\n` +
        `The ${name} link returned a "not found" error. ` +
        `The file may have been deleted or the URL may be incorrect.\n\n` +
        `Please verify your link works and resubmit.` +
        FOOTER
      );

    case 'NO_AUDIO':
      return (
        `Your post has been removed because **no audio content was detected** in the linked files.\n\n` +
        `r/Drumkits is for sharing drum kits and sample packs (audio files like .wav, .mp3, .zip). ` +
        `The link you posted doesn't appear to contain any audio files.\n\n` +
        `If your kit is inside a folder, make sure it contains audio files or .zip archives.` +
        FOOTER
      );

    case 'NEEDS_REVIEW':
      // This shouldn't be used for user-facing comments — it's a mod note
      return `[Mod note] Sountinel could not fully validate this post's link. Please review manually.`;
  }
}

export function getFlairText(failureType: FailureType, provider?: Provider): string {
  switch (failureType) {
    case 'PRIVATE_LINK':
      return 'Needs Fix: Private Link';
    case 'INVALID_LINK':
      return provider === 'google_drive' ? 'Needs Fix: Link Not Accessible' : 'Removed: Dead Link';
    case 'NO_AUDIO':
      return 'Removed: No Audio';
    case 'NEEDS_REVIEW':
      return 'Needs Review';
  }
}
