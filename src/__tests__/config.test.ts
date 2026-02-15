import { isAudioFile, isArchiveFile, isAudioOrArchive } from '../config.js';

describe('isAudioFile', () => {
  it('recognizes common audio formats', () => {
    expect(isAudioFile('beat.mp3')).toBe(true);
    expect(isAudioFile('snare.wav')).toBe(true);
    expect(isAudioFile('pad.ogg')).toBe(true);
    expect(isAudioFile('bass.flac')).toBe(true);
    expect(isAudioFile('hihat.m4a')).toBe(true);
    expect(isAudioFile('kick.aac')).toBe(true);
    expect(isAudioFile('perc.opus')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(isAudioFile('BEAT.MP3')).toBe(true);
    expect(isAudioFile('Snare.WAV')).toBe(true);
  });

  it('rejects non-audio files', () => {
    expect(isAudioFile('readme.txt')).toBe(false);
    expect(isAudioFile('cover.jpg')).toBe(false);
    expect(isAudioFile('preset.fxp')).toBe(false);
    expect(isAudioFile('document.pdf')).toBe(false);
  });
});

describe('isArchiveFile', () => {
  it('recognizes archive formats', () => {
    expect(isArchiveFile('kit.zip')).toBe(true);
    expect(isArchiveFile('drums.rar')).toBe(true);
    expect(isArchiveFile('samples.7z')).toBe(true);
  });

  it('rejects non-archive files', () => {
    expect(isArchiveFile('beat.mp3')).toBe(false);
    expect(isArchiveFile('readme.txt')).toBe(false);
  });
});

describe('isAudioOrArchive', () => {
  it('accepts both audio and archive', () => {
    expect(isAudioOrArchive('beat.mp3')).toBe(true);
    expect(isAudioOrArchive('kit.zip')).toBe(true);
  });

  it('rejects neither', () => {
    expect(isAudioOrArchive('image.png')).toBe(false);
  });
});
