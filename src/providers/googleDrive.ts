import type { ValidationResult } from '../types.js';
import {
  DRIVE_API_BASE,
  FOLDER_PAGE_SIZE,
  REQUEST_TIMEOUT_MS,
  isAudioFile,
  isArchiveFile,
  isAudioOrArchive,
} from '../config.js';

// Google Drive URL patterns — captures the file/folder ID
// /u/0/ is an account selector prefix that can appear in any Drive URL
const GDRIVE_FILE_PATTERN = /drive\.google\.com\/(?:u\/\d+\/)?file\/d\/([a-zA-Z0-9_-]+)/;
const GDRIVE_OPEN_PATTERN = /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/;
const GDRIVE_FOLDER_PATTERN = /drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/([a-zA-Z0-9_-]+)/;

interface DriveMetadata {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
}

interface DriveFileEntry {
  name: string;
  mimeType: string;
}

function extractDriveId(url: string): string | null {
  for (const pattern of [GDRIVE_FILE_PATTERN, GDRIVE_OPEN_PATTERN, GDRIVE_FOLDER_PATTERN]) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function detectFileType(metadata: DriveMetadata): 'folder' | 'archive' | 'file' {
  if (metadata.mimeType === 'application/vnd.google-apps.folder') return 'folder';
  if (isArchiveFile(metadata.name)) return 'archive';
  return 'file';
}

async function fetchMetadata(
  driveId: string,
  apiKey: string,
): Promise<{ metadata?: DriveMetadata; result?: ValidationResult }> {
  const url = `${DRIVE_API_BASE}/files/${driveId}?key=${apiKey}&fields=id,name,mimeType,size`;

  const response = await fetch(url, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (response.status === 404) {
    return { result: { status: 'FAIL', failureType: 'INVALID_LINK', message: 'File or folder not found' } };
  }
  if (response.status === 403) {
    return { result: { status: 'FAIL', failureType: 'PRIVATE_LINK', message: 'File or folder is private' } };
  }
  if (!response.ok) {
    return { result: { status: 'ERROR', message: `Drive API returned ${response.status}` } };
  }

  const metadata = (await response.json()) as DriveMetadata;
  return { metadata };
}

async function listFolderFiles(
  folderId: string,
  apiKey: string,
): Promise<DriveFileEntry[]> {
  const url =
    `${DRIVE_API_BASE}/files?q='${folderId}'+in+parents` +
    `&key=${apiKey}&fields=files(name,mimeType)&pageSize=${FOLDER_PAGE_SIZE}`;

  const response = await fetch(url, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) return [];

  const data = (await response.json()) as { files: DriveFileEntry[] };
  return data.files || [];
}

async function checkFolderAudio(
  folderId: string,
  apiKey: string,
): Promise<{ hasAudio: boolean; needsReview: boolean }> {
  const files = await listFolderFiles(folderId, apiKey);
  if (files.length === 0) {
    return { hasAudio: false, needsReview: false };
  }

  // Check root-level files for audio or archives
  if (files.some(f => isAudioOrArchive(f.name))) {
    return { hasAudio: true, needsReview: false };
  }

  // Root has no audio — check subfolders (1 level deep)
  const subfolders = files.filter(f => f.mimeType === 'application/vnd.google-apps.folder');
  for (const subfolder of subfolders) {
    // We need the subfolder's ID, but listFolderFiles only returns name+mimeType.
    // Re-query with id field for subfolders.
    const subUrl =
      `${DRIVE_API_BASE}/files?q='${folderId}'+in+parents+and+mimeType='application/vnd.google-apps.folder'` +
      `&key=${apiKey}&fields=files(id,name)&pageSize=${FOLDER_PAGE_SIZE}`;
    const subResponse = await fetch(subUrl, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!subResponse.ok) break;

    const subData = (await subResponse.json()) as { files: Array<{ id: string; name: string }> };
    for (const sub of subData.files || []) {
      const subFiles = await listFolderFiles(sub.id, apiKey);
      if (subFiles.some(f => isAudioOrArchive(f.name))) {
        return { hasAudio: true, needsReview: false };
      }
    }
    break; // Only do this query once (we already have all subfolders)
  }

  // No audio found after 1 level — don't auto-remove, send to mod queue
  return { hasAudio: false, needsReview: true };
}

export async function validateGoogleDrive(
  url: string,
  apiKey?: string,
): Promise<ValidationResult> {
  if (!apiKey) {
    return { status: 'ERROR', message: 'Google Drive API key not configured' };
  }

  const driveId = extractDriveId(url);
  if (!driveId) {
    return { status: 'FAIL', failureType: 'INVALID_LINK', message: 'Could not extract Drive ID from URL' };
  }

  try {
    const { metadata, result } = await fetchMetadata(driveId, apiKey);
    if (result) return result;

    const fileType = detectFileType(metadata!);

    if (fileType === 'archive') {
      // ZIPs/RARs assumed to contain audio
      return { status: 'PASS' };
    }

    if (fileType === 'file') {
      if (isAudioFile(metadata!.name)) {
        return { status: 'PASS' };
      }
      return { status: 'FAIL', failureType: 'NO_AUDIO', message: `File "${metadata!.name}" is not an audio file` };
    }

    // Folder
    const audioCheck = await checkFolderAudio(driveId, apiKey);
    if (audioCheck.hasAudio) {
      return { status: 'PASS' };
    }
    if (audioCheck.needsReview) {
      return { status: 'ERROR', failureType: 'NEEDS_REVIEW', message: 'No audio found after 1-level traversal' };
    }
    return { status: 'FAIL', failureType: 'NO_AUDIO', message: 'Empty folder — no files found' };

  } catch (error: any) {
    const msg = String(error.message || error);
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return { status: 'ERROR', message: 'Drive API timed out' };
    }
    // Devvit's HTTP proxy throws on 404/403 instead of returning status codes
    if (msg.includes('404') || msg.includes('notFound') || msg.includes('Not Found')) {
      return { status: 'FAIL', failureType: 'INVALID_LINK', message: 'File or folder not found' };
    }
    if (msg.includes('403') || msg.includes('Forbidden') || msg.includes('notAuthorized')) {
      return { status: 'FAIL', failureType: 'PRIVATE_LINK', message: 'File or folder is private' };
    }
    return { status: 'ERROR', message: 'Drive API error' };
  }
}
