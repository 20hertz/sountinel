/**
 * Unit Tests for Google Drive Validator
 *
 * This module tests the Google Drive link validation and ID extraction logic.
 *
 * Test Coverage:
 * - ID extraction from various URL formats
 * - Validation logic (mocked Google Drive API)
 * - Error handling
 *
 * Note: These tests focus on ID extraction. Full validation tests would
 * require mocking the Google Drive API, which is Phase 2 work.
 */

import { extractGoogleDriveId, AUDIO_FORMATS } from '../googleDriveValidator.js';

describe('Google Drive Validator', () => {
  describe('extractGoogleDriveId', () => {
    test('extracts ID from standard file URL', () => {
      const url = 'https://drive.google.com/file/d/1ABC123xyz-_/view?usp=sharing';
      const id = extractGoogleDriveId(url);
      expect(id).toBe('1ABC123xyz-_');
    });

    test('extracts ID from open?id= format', () => {
      const url = 'https://drive.google.com/open?id=1ABC123xyz-_';
      const id = extractGoogleDriveId(url);
      expect(id).toBe('1ABC123xyz-_');
    });

    test('extracts ID from folder URL', () => {
      const url = 'https://drive.google.com/drive/folders/1ABC123xyz-_';
      const id = extractGoogleDriveId(url);
      expect(id).toBe('1ABC123xyz-_');
    });

    test('extracts ID from Google Docs URL', () => {
      const url = 'https://docs.google.com/document/d/1ABC123xyz-_/edit';
      const id = extractGoogleDriveId(url);
      expect(id).toBe('1ABC123xyz-_');
    });

    test('extracts ID from Google Sheets URL', () => {
      const url = 'https://docs.google.com/spreadsheets/d/1ABC123xyz-_/edit';
      const id = extractGoogleDriveId(url);
      expect(id).toBe('1ABC123xyz-_');
    });

    test('extracts ID from Google Slides URL', () => {
      const url = 'https://docs.google.com/presentation/d/1ABC123xyz-_/edit';
      const id = extractGoogleDriveId(url);
      expect(id).toBe('1ABC123xyz-_');
    });

    test('handles URL with query parameters', () => {
      const url = 'https://drive.google.com/file/d/1ABC123xyz/view?usp=sharing&foo=bar';
      const id = extractGoogleDriveId(url);
      expect(id).toBe('1ABC123xyz');
    });

    test('handles URL with fragment', () => {
      const url = 'https://drive.google.com/file/d/1ABC123xyz/view#section';
      const id = extractGoogleDriveId(url);
      expect(id).toBe('1ABC123xyz');
    });

    test('returns null for empty string', () => {
      const id = extractGoogleDriveId('');
      expect(id).toBeNull();
    });

    test('returns null for null input', () => {
      const id = extractGoogleDriveId(null as any);
      expect(id).toBeNull();
    });

    test('returns null for non-Google Drive URL', () => {
      const url = 'https://www.dropbox.com/s/abc123/file.zip';
      const id = extractGoogleDriveId(url);
      expect(id).toBeNull();
    });

    test('returns null for malformed Google Drive URL', () => {
      const url = 'https://drive.google.com/file/';
      const id = extractGoogleDriveId(url);
      expect(id).toBeNull();
    });

    test('extracts ID with special characters', () => {
      const url = 'https://drive.google.com/file/d/1aB-cD_eF2/view';
      const id = extractGoogleDriveId(url);
      expect(id).toBe('1aB-cD_eF2');
    });

    test('extracts long ID', () => {
      const longId = '1' + 'a'.repeat(50) + 'Z';
      const url = `https://drive.google.com/file/d/${longId}/view`;
      const id = extractGoogleDriveId(url);
      expect(id).toBe(longId);
    });
  });

  describe('AUDIO_FORMATS constant', () => {
    test('includes all supported audio formats', () => {
      const expectedFormats = ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'opus'];
      expect(AUDIO_FORMATS).toEqual(expectedFormats);
    });

    test('contains only lowercase extensions', () => {
      AUDIO_FORMATS.forEach((format: string) => {
        expect(format).toBe(format.toLowerCase());
      });
    });
  });
});
