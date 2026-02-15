export const AUDIO_EXTENSIONS = ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'opus'];
export const ARCHIVE_EXTENSIONS = ['zip', 'rar', '7z'];

export const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
export const FOLDER_PAGE_SIZE = 100;
export const MAX_SUBFOLDER_DEPTH = 1;
export const REQUEST_TIMEOUT_MS = 10_000;

export function isAudioFile(filename: string): boolean {
  const lower = filename.toLowerCase();
  return AUDIO_EXTENSIONS.some(ext => lower.endsWith(`.${ext}`));
}

export function isArchiveFile(filename: string): boolean {
  const lower = filename.toLowerCase();
  return ARCHIVE_EXTENSIONS.some(ext => lower.endsWith(`.${ext}`));
}

export function isAudioOrArchive(filename: string): boolean {
  return isAudioFile(filename) || isArchiveFile(filename);
}
