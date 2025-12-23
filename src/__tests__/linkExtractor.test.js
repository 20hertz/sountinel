/**
 * Unit Tests for Link Extraction
 *
 * This module tests the link extraction logic used by the monitoring system
 * to identify supported file sharing services (Google Drive only).
 *
 * Test Coverage:
 * - Google Drive URLs (various formats)
 * - Invalid URLs (unsupported services)
 * - Edge cases (empty strings, malformed URLs, etc.)
 *
 * Target Coverage: >80%
 */
import { extractSupportedLink, isSupportedLink } from '../linkExtractor.js';
describe('Link Extraction', () => {
    describe('Google Drive URLs', () => {
        test('extracts standard Google Drive file URL', () => {
            const url = 'https://drive.google.com/file/d/1ABC123xyz-_/view?usp=sharing';
            expect(extractSupportedLink(url)).toBe(url);
        });
        test('extracts HTTP (non-HTTPS) Google Drive URL', () => {
            const url = 'http://drive.google.com/file/d/1ABC123xyz-_/view';
            expect(extractSupportedLink(url)).toBe(url);
        });
        test('extracts Google Drive open?id= format', () => {
            const url = 'https://drive.google.com/open?id=1ABC123xyz-_';
            expect(extractSupportedLink(url)).toBe(url);
        });
        test('extracts Google Drive folder URL', () => {
            const url = 'https://drive.google.com/drive/folders/1ABC123xyz-_';
            expect(extractSupportedLink(url)).toBe(url);
        });
        test('extracts Google Docs document URL', () => {
            const url = 'https://docs.google.com/document/d/1ABC123xyz-_/edit';
            expect(extractSupportedLink(url)).toBe(url);
        });
        test('extracts Google Sheets URL', () => {
            const url = 'https://docs.google.com/spreadsheets/d/1ABC123xyz-_/edit';
            expect(extractSupportedLink(url)).toBe(url);
        });
        test('extracts Google Slides URL', () => {
            const url = 'https://docs.google.com/presentation/d/1ABC123xyz-_/edit';
            expect(extractSupportedLink(url)).toBe(url);
        });
        test('extracts Google Drive URL with long alphanumeric ID', () => {
            const url = 'https://drive.google.com/file/d/1a2B3c4D5e6F7g8H9i0JkLmNoPqRsTuVwXyZ_-/view';
            expect(extractSupportedLink(url)).toBe(url);
        });
        test('extracts Google Drive URL with minimum valid ID length', () => {
            const url = 'https://drive.google.com/file/d/abc/view';
            expect(extractSupportedLink(url)).toBe(url);
        });
        test('extracts Google Drive URL with special characters in ID', () => {
            const url = 'https://drive.google.com/file/d/abc-123_XYZ/view';
            expect(extractSupportedLink(url)).toBe(url);
        });
        test('extracts URL with fragment identifier', () => {
            const url = 'https://drive.google.com/file/d/1ABC123xyz/view#page=1';
            expect(extractSupportedLink(url)).not.toBeNull();
        });
        test('extracts URL with multiple query parameters', () => {
            const url = 'https://drive.google.com/file/d/1ABC123xyz/view?usp=sharing&foo=bar';
            expect(extractSupportedLink(url)).toBe(url);
        });
        test('extracts very long URL', () => {
            const longId = 'a'.repeat(500);
            const url = `https://drive.google.com/file/d/${longId}/view`;
            expect(extractSupportedLink(url)).toBe(url);
        });
        test('extracts URL with Unicode query parameters', () => {
            const url = 'https://drive.google.com/file/d/1ABC123/view?filename=日本語.zip';
            expect(extractSupportedLink(url)).toBe(url);
        });
    });
    describe('Invalid URLs', () => {
        test('rejects YouTube URL', () => {
            const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
            expect(extractSupportedLink(url)).toBeNull();
        });
        test('rejects Reddit URL', () => {
            const url = 'https://www.reddit.com/r/drumkits/comments/abc123/title';
            expect(extractSupportedLink(url)).toBeNull();
        });
        test('rejects Imgur URL', () => {
            const url = 'https://imgur.com/a/abc123';
            expect(extractSupportedLink(url)).toBeNull();
        });
        test('rejects SoundCloud URL', () => {
            const url = 'https://soundcloud.com/artist/track';
            expect(extractSupportedLink(url)).toBeNull();
        });
        test('rejects MediaFire URL', () => {
            const url = 'https://www.mediafire.com/file/abc123/file.zip/file';
            expect(extractSupportedLink(url)).toBeNull();
        });
        test('rejects MEGA.nz URL', () => {
            const url = 'https://mega.nz/file/abc123#xyz';
            expect(extractSupportedLink(url)).toBeNull();
        });
        test('rejects WeTransfer URL', () => {
            const url = 'https://wetransfer.com/downloads/abc123';
            expect(extractSupportedLink(url)).toBeNull();
        });
        test('rejects Dropbox URL', () => {
            const url = 'https://www.dropbox.com/s/abc123xyz/filename.zip?dl=0';
            expect(extractSupportedLink(url)).toBeNull();
        });
    });
    describe('Edge Cases', () => {
        test('handles empty string', () => {
            const url = '';
            expect(extractSupportedLink(url)).toBeNull();
        });
        test('handles null input', () => {
            const url = null;
            expect(extractSupportedLink(url)).toBeNull();
        });
        test('handles whitespace-only string', () => {
            const url = '   ';
            expect(extractSupportedLink(url)).toBeNull();
        });
        test('rejects malformed Google Drive URL without ID', () => {
            const url = 'https://drive.google.com/file/d/';
            expect(extractSupportedLink(url)).toBeNull();
        });
        test('rejects URL with case-sensitive domain mismatch', () => {
            const url = 'https://DRIVE.GOOGLE.COM/file/d/1ABC123/view';
            expect(extractSupportedLink(url)).toBeNull();
        });
        test('rejects URL with unexpected subdomain', () => {
            const url = 'https://subdomain.drive.google.com/file/d/1ABC123/view';
            expect(extractSupportedLink(url)).toBeNull();
        });
    });
    describe('Real-World Examples', () => {
        test('extracts real Google Drive shared folder URL', () => {
            const url = 'https://drive.google.com/drive/folders/1-2AbCdEfGhIjKlMnOpQrStUvWxYz';
            expect(extractSupportedLink(url)).toBe(url);
        });
        test('extracts Google Drive URL with tracking parameters', () => {
            const url = 'https://drive.google.com/file/d/1ABC-xyz_123/view?usp=drivesdk';
            expect(extractSupportedLink(url)).toBe(url);
        });
        test('rejects shortened URL', () => {
            const url = 'https://bit.ly/3abc123';
            expect(extractSupportedLink(url)).toBeNull();
        });
    });
    describe('isSupportedLink Helper', () => {
        test('returns true for valid Google Drive URL', () => {
            const url = 'https://drive.google.com/file/d/123/view';
            expect(isSupportedLink(url)).toBe(true);
        });
        test('returns false for invalid URL', () => {
            const url = 'https://example.com/file';
            expect(isSupportedLink(url)).toBe(false);
        });
    });
    describe('All Pattern Variations', () => {
        test('extracts all Google Drive pattern variations', () => {
            const urls = [
                'https://drive.google.com/file/d/123/view',
                'https://drive.google.com/open?id=123',
                'https://drive.google.com/drive/folders/123',
                'https://docs.google.com/document/d/123/edit',
                'https://docs.google.com/spreadsheets/d/123/edit',
                'https://docs.google.com/presentation/d/123/edit',
            ];
            for (const url of urls) {
                const result = extractSupportedLink(url);
                expect(result).toBe(url);
            }
        });
    });
});
