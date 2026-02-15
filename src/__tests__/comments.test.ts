import { buildComment, getFlairText } from '../comments.js';

describe('buildComment', () => {
  it('builds private link comment with provider-specific instructions', () => {
    const comment = buildComment('PRIVATE_LINK', 'google_drive', 'https://drive.google.com/file/d/abc');
    expect(comment).toContain('not publicly accessible');
    expect(comment).toContain('Google Drive');
    expect(comment).toContain('Anyone with the link');
    expect(comment).toContain('Sountinel');
  });

  it('builds Google Drive INVALID_LINK as not-accessible (could be private or deleted)', () => {
    const comment = buildComment('INVALID_LINK', 'google_drive', 'https://drive.google.com/file/d/abc');
    expect(comment).toContain('not accessible');
    expect(comment).toContain('private');
    expect(comment).toContain('deleted');
    expect(comment).toContain('Anyone with the link');
  });

  it('builds non-Google INVALID_LINK as broken/deleted', () => {
    const comment = buildComment('INVALID_LINK', 'dropbox', 'https://www.dropbox.com/s/abc/file.zip');
    expect(comment).toContain('broken or deleted');
    expect(comment).toContain('Dropbox');
  });

  it('builds no audio comment', () => {
    const comment = buildComment('NO_AUDIO', 'mediafire', 'https://www.mediafire.com/file/abc/doc.pdf/file');
    expect(comment).toContain('no audio content');
    expect(comment).toContain('.wav');
    expect(comment).toContain('.mp3');
  });

  it('builds needs review mod note', () => {
    const comment = buildComment('NEEDS_REVIEW', 'google_drive', 'https://drive.google.com/drive/folders/abc');
    expect(comment).toContain('Mod note');
    expect(comment).toContain('review manually');
  });
});

describe('getFlairText', () => {
  it('maps failure types to flair text', () => {
    expect(getFlairText('PRIVATE_LINK')).toBe('Needs Fix: Private Link');
    expect(getFlairText('NO_AUDIO')).toBe('Removed: No Audio');
    expect(getFlairText('NEEDS_REVIEW')).toBe('Needs Review');
  });

  it('uses provider-aware flair for INVALID_LINK', () => {
    expect(getFlairText('INVALID_LINK', 'google_drive')).toBe('Needs Fix: Link Not Accessible');
    expect(getFlairText('INVALID_LINK', 'dropbox')).toBe('Removed: Dead Link');
    expect(getFlairText('INVALID_LINK')).toBe('Removed: Dead Link');
  });
});
