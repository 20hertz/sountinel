import type { ValidationResult } from '../types.js';
import { REQUEST_TIMEOUT_MS, isAudioOrArchive } from '../config.js';

// Dropbox shared link patterns
const DROPBOX_FILE_PATTERN = /dropbox\.com\/(?:s|scl\/fi)\/[a-zA-Z0-9_-]+\/([^?]+)/;
const DROPBOX_FOLDER_PATTERN = /dropbox\.com\/(?:sh|scl\/fo)\/[a-zA-Z0-9_-]+/;

function extractFilename(url: string): string | null {
  const match = url.match(DROPBOX_FILE_PATTERN);
  if (!match) return null;
  return decodeURIComponent(match[1]);
}

function isFolder(url: string): boolean {
  return DROPBOX_FOLDER_PATTERN.test(url);
}

/**
 * Validate a Dropbox shared link via HTTP GET.
 *
 * MVP approach: fetch the shared link page and parse the HTML response
 * to determine accessibility and content type. No Dropbox API key needed.
 */
export async function validateDropbox(url: string): Promise<ValidationResult> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Sountinel/2.0; +https://reddit.com/r/Drumkits)',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    // 404 — dead link
    if (response.status === 404) {
      return { status: 'FAIL', failureType: 'INVALID_LINK', message: 'Dropbox link not found' };
    }

    if (!response.ok) {
      return { status: 'ERROR', message: `Dropbox returned HTTP ${response.status}` };
    }

    const html = await response.text();

    // Detect private/login-required pages
    if (
      html.includes('This file was deleted') ||
      html.includes('This link has been removed') ||
      html.includes('isn\u2019t available')
    ) {
      return { status: 'FAIL', failureType: 'INVALID_LINK', message: 'Dropbox link is deleted or unavailable' };
    }

    if (
      html.includes('Log in to Dropbox') ||
      html.includes('This file is private') ||
      html.includes('Request access')
    ) {
      return { status: 'FAIL', failureType: 'PRIVATE_LINK', message: 'Dropbox link requires login or permission' };
    }

    // For folders, check if the page lists any files
    if (isFolder(url)) {
      // Dropbox folder pages render file listings. If we can see the page
      // and it doesn't show error states above, send to mod queue for review
      // since parsing the JS-rendered file list is unreliable.
      return { status: 'ERROR', failureType: 'NEEDS_REVIEW', message: 'Dropbox folder — cannot reliably inspect contents' };
    }

    // For single files, check filename from URL
    const filename = extractFilename(url);
    if (filename && isAudioOrArchive(filename)) {
      return { status: 'PASS' };
    }

    // Try to find filename in the HTML page metadata
    const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/);
    if (titleMatch) {
      const pageFilename = titleMatch[1];
      if (isAudioOrArchive(pageFilename)) {
        return { status: 'PASS' };
      }
      return { status: 'FAIL', failureType: 'NO_AUDIO', message: `File "${pageFilename}" is not an audio file` };
    }

    // Filename not determinable — don't auto-remove
    if (filename) {
      // We have a filename but it's not audio/archive
      return { status: 'FAIL', failureType: 'NO_AUDIO', message: `File "${filename}" is not an audio file` };
    }

    return { status: 'ERROR', failureType: 'NEEDS_REVIEW', message: 'Could not determine file type from Dropbox link' };

  } catch (error: any) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return { status: 'ERROR', message: 'Dropbox request timed out' };
    }
    return { status: 'ERROR', message: `Dropbox validation error: ${error.message}` };
  }
}
