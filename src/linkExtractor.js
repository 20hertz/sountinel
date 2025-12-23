/**
 * Link Extraction Logic
 *
 * This module extracts supported links from Reddit post URLs.
 * Currently supports Google Drive links only.
 *
 * Supported patterns:
 * - Google Drive: https://drive.google.com/file/d/{id}
 * - Google Drive: https://drive.google.com/open?id={id}
 * - Google Drive: https://drive.google.com/drive/folders/{id}
 * - Google Docs: https://docs.google.com/document/d/{id}
 *
 * Note: Dropbox and other services are intentionally not supported
 * to maintain focus on Google Drive integration.
 */
/**
 * Google Drive URL patterns
 */
const GDRIVE_PATTERNS = [
    /https?:\/\/drive\.google\.com\/file\/d\/[a-zA-Z0-9_-]+/,
    /https?:\/\/drive\.google\.com\/open\?id=[a-zA-Z0-9_-]+/,
    /https?:\/\/drive\.google\.com\/drive\/folders\/[a-zA-Z0-9_-]+/,
    /https?:\/\/docs\.google\.com\/document\/d\/[a-zA-Z0-9_-]+/,
    /https?:\/\/docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9_-]+/,
    /https?:\/\/docs\.google\.com\/presentation\/d\/[a-zA-Z0-9_-]+/,
];
/**
 * Extract Google Drive links from a URL
 *
 * This function checks if the provided URL matches any supported
 * Google Drive pattern. If a match is found, it returns the original
 * URL. If no match is found, it returns null.
 *
 * @param url - URL to extract from (typically post.url)
 * @returns The original URL if it matches a supported pattern, null otherwise
 */
export function extractSupportedLink(url) {
    if (!url) {
        return null;
    }
    // Check against all Google Drive patterns
    for (const pattern of GDRIVE_PATTERNS) {
        if (pattern.test(url)) {
            return url;
        }
    }
    return null;
}
/**
 * Check if a URL is a supported Google Drive link
 *
 * This is a convenience function that returns a boolean instead of the URL.
 *
 * @param url - URL to check
 * @returns true if the URL is a supported Google Drive link, false otherwise
 */
export function isSupportedLink(url) {
    return extractSupportedLink(url) !== null;
}
