import type { ValidationResult } from '../types.js';
import { REQUEST_TIMEOUT_MS, isAudioOrArchive } from '../config.js';

// MediaFire URL patterns
const MEDIAFIRE_FILE_PATTERN = /mediafire\.com\/file\/[a-zA-Z0-9]+\/([^/]+)\/file/;
const MEDIAFIRE_FOLDER_PATTERN = /mediafire\.com\/folder\/[a-zA-Z0-9]+/;
const MEDIAFIRE_PREMIUM_PATTERN = /mediafire\.com\/file_premium\//;
const MEDIAFIRE_LEGACY_PATTERN = /mediafire\.com\/\?[a-zA-Z0-9]+/;

function extractFilename(url: string): string | null {
  const match = url.match(MEDIAFIRE_FILE_PATTERN);
  if (!match) return null;
  return decodeURIComponent(match[1]);
}

function isFolder(url: string): boolean {
  return MEDIAFIRE_FOLDER_PATTERN.test(url);
}

function isPremium(url: string): boolean {
  return MEDIAFIRE_PREMIUM_PATTERN.test(url);
}

/**
 * Validate a MediaFire shared link via HTTP GET.
 *
 * MediaFire has no practical public API for unauthenticated use,
 * so we fetch the page HTML and parse it for accessibility and file info.
 */
export async function validateMediafire(url: string): Promise<ValidationResult> {
  // Premium links are paywalled — treated as inaccessible
  if (isPremium(url)) {
    return { status: 'FAIL', failureType: 'PRIVATE_LINK', message: 'MediaFire premium link requires payment' };
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Sountinel/2.0; +https://reddit.com/r/Drumkits)',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (response.status === 404) {
      return { status: 'FAIL', failureType: 'INVALID_LINK', message: 'MediaFire file not found' };
    }

    if (!response.ok) {
      return { status: 'ERROR', message: `MediaFire returned HTTP ${response.status}` };
    }

    const html = await response.text();

    // Detect deleted/invalid files
    if (
      html.includes('Invalid or Deleted File') ||
      html.includes('The file you requested was not found') ||
      html.includes('This file has been removed')
    ) {
      return { status: 'FAIL', failureType: 'INVALID_LINK', message: 'MediaFire file is deleted or invalid' };
    }

    // Detect password-protected or private files
    if (html.includes('This file is password protected') || html.includes('Enter password')) {
      return { status: 'FAIL', failureType: 'PRIVATE_LINK', message: 'MediaFire file is password-protected' };
    }

    // Folders — can't reliably parse JS-rendered file listing
    if (isFolder(url)) {
      // If the page loaded without error, the folder exists and is accessible.
      // But we can't easily inspect contents, so send to mod queue.
      return { status: 'ERROR', failureType: 'NEEDS_REVIEW', message: 'MediaFire folder — cannot reliably inspect contents' };
    }

    // Single file — check filename from URL
    const filename = extractFilename(url);
    if (filename && isAudioOrArchive(filename)) {
      return { status: 'PASS' };
    }

    // Try to find filename in the HTML page
    const filenameMatch = html.match(/class="dl-btn-label"\s+title="([^"]+)"/);
    if (filenameMatch) {
      const pageFilename = filenameMatch[1];
      if (isAudioOrArchive(pageFilename)) {
        return { status: 'PASS' };
      }
      return { status: 'FAIL', failureType: 'NO_AUDIO', message: `File "${pageFilename}" is not an audio file` };
    }

    // Fallback: look for filename in og:title meta
    const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/);
    if (titleMatch) {
      const pageFilename = titleMatch[1];
      if (isAudioOrArchive(pageFilename)) {
        return { status: 'PASS' };
      }
      return { status: 'FAIL', failureType: 'NO_AUDIO', message: `File "${pageFilename}" is not an audio file` };
    }

    if (filename) {
      return { status: 'FAIL', failureType: 'NO_AUDIO', message: `File "${filename}" is not an audio file` };
    }

    return { status: 'ERROR', failureType: 'NEEDS_REVIEW', message: 'Could not determine file type from MediaFire link' };

  } catch (error: any) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return { status: 'ERROR', message: 'MediaFire request timed out' };
    }
    return { status: 'ERROR', message: `MediaFire validation error: ${error.message}` };
  }
}
