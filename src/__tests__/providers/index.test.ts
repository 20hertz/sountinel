import { identifyProvider } from '../../providers/index.js';

describe('identifyProvider', () => {
  it('identifies Google Drive file links', () => {
    expect(identifyProvider('https://drive.google.com/file/d/abc123/view')).toBe('google_drive');
  });

  it('identifies Google Drive folder links', () => {
    expect(identifyProvider('https://drive.google.com/drive/folders/abc123')).toBe('google_drive');
  });

  it('identifies Dropbox shared file links', () => {
    expect(identifyProvider('https://www.dropbox.com/s/abc123/mykit.zip?dl=0')).toBe('dropbox');
    expect(identifyProvider('https://www.dropbox.com/scl/fi/abc123/mykit.zip')).toBe('dropbox');
  });

  it('identifies Dropbox shared folder links', () => {
    expect(identifyProvider('https://www.dropbox.com/sh/abc123/folderName')).toBe('dropbox');
    expect(identifyProvider('https://www.dropbox.com/scl/fo/abc123/folderName')).toBe('dropbox');
  });

  it('identifies MediaFire file links', () => {
    expect(identifyProvider('https://www.mediafire.com/file/abc123/mykit.zip/file')).toBe('mediafire');
  });

  it('identifies MediaFire folder links', () => {
    expect(identifyProvider('https://www.mediafire.com/folder/abc123/myFolder')).toBe('mediafire');
  });

  it('returns null for docs.google.com', () => {
    expect(identifyProvider('https://docs.google.com/document/d/abc123')).toBeNull();
  });

  it('returns null for unsupported providers', () => {
    expect(identifyProvider('https://mega.nz/file/abc123')).toBeNull();
    expect(identifyProvider('https://wetransfer.com/downloads/abc123')).toBeNull();
    expect(identifyProvider('https://www.youtube.com/watch?v=abc123')).toBeNull();
  });

  it('returns null for empty/self-post URLs', () => {
    expect(identifyProvider('')).toBeNull();
    expect(identifyProvider('https://www.reddit.com/r/Drumkits/comments/abc123')).toBeNull();
  });
});
