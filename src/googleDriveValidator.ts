/**
 * Google Drive Link Validator
 *
 * This module provides validation for Google Drive links to ensure they:
 * 1. Are accessible (not private or deleted)
 * 2. Contain supported audio files
 * 3. Can be processed by the Boomtap web application
 *
 * The validation logic mirrors the webapp's validation to ensure consistent
 * behavior across all systems.
 *
 * Supported audio formats: mp3, wav, ogg, flac, m4a, aac, opus
 * Supported Drive types: folders, ZIP files, single audio files
 *
 * Usage:
 *   const result = await validateGoogleDriveLink(driveId, apiKey, requestOrigin);
 *   if (result.success) {
 *     console.log(`Preview URL: ${result.previewUrl}`);
 *   } else {
 *     console.log(`Error: ${result.errorType}`);
 *   }
 */

// Supported audio file formats
export const AUDIO_FORMATS: string[] = ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'opus'];

// Google Drive API endpoints
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';

// Google Drive URL patterns
const GDRIVE_FILE_PATTERN = /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
const GDRIVE_OPEN_PATTERN = /https:\/\/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/;
const GDRIVE_FOLDER_PATTERN = /https:\/\/drive\.google\.com\/drive\/folders\/([a-zA-Z0-9_-]+)/;
const GDOCS_PATTERN = /https:\/\/docs\.google\.com\/(document|spreadsheets|presentation)\/d\/([a-zA-Z0-9_-]+)/;

/**
 * Validation result interface
 */
export interface ValidationResult {
  success: boolean;
  previewUrl?: string;
  errorType?: 'INVALID_LINK' | 'PRIVATE_LINK' | 'EMPTY_FOLDER' | 'TIMEOUT' | 'API_ERROR';
  message?: string;
  metadata?: {
    name: string;
    fileType: 'folder' | 'zip' | 'file';
    audioFileCount: number;
  };
}

/**
 * Drive metadata interface
 */
interface DriveMetadata {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
}

/**
 * Internal metadata result
 */
interface MetadataResult {
  success: boolean;
  metadata?: DriveMetadata;
  errorType?: 'INVALID_LINK' | 'PRIVATE_LINK' | 'TIMEOUT' | 'API_ERROR';
}

/**
 * Audio content check result
 */
interface AudioCheckResult {
  hasAudio: boolean;
  audioCount: number;
}

/**
 * Extract Google Drive ID from a URL
 *
 * @param url - Google Drive URL
 * @returns Drive ID if found, null otherwise
 */
export function extractGoogleDriveId(url: string): string | null {
  if (!url) {
    return null;
  }

  // Try all Google Drive patterns
  const patterns = [
    GDRIVE_FILE_PATTERN,
    GDRIVE_OPEN_PATTERN,
    GDRIVE_FOLDER_PATTERN,
    GDOCS_PATTERN,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      // Return the captured group (ID)
      // For Google Docs pattern, the ID is in group 2 (group 1 is document type)
      if (pattern === GDOCS_PATTERN) {
        return match[2];
      }
      return match[1];
    }
  }

  return null;
}

/**
 * Validate a Google Drive link before generating preview URL
 *
 * This performs a multi-step validation:
 * 1. Check if file/folder exists and is accessible
 * 2. Detect file type (folder, ZIP, or single file)
 * 3. Verify the presence of supported audio files
 *
 * @param driveId - Google Drive file/folder ID (extracted from URL)
 * @param apiKey - Google Drive API key for authentication
 * @param requestOrigin - Origin URL to use in Referer header (e.g., "https://boomtap.app")
 * @returns ValidationResult with success status and metadata or error details
 */
export async function validateGoogleDriveLink(
  driveId: string,
  apiKey: string,
  requestOrigin: string
): Promise<ValidationResult> {
  try {
    // Step 1: Check if file/folder exists and is accessible
    const metadataResult = await fetchDriveMetadata(driveId, apiKey, requestOrigin);
    if (!metadataResult.success) {
      return {
        success: false,
        errorType: metadataResult.errorType,
        message: getErrorMessage(metadataResult.errorType),
      };
    }

    // Step 2: Detect file type (folder, zip, or single file)
    const fileType = detectFileType(metadataResult.metadata!);

    // Step 3: Check for supported audio files
    const audioCheck = await checkAudioContent(
      driveId,
      fileType,
      apiKey,
      requestOrigin,
      metadataResult.metadata
    );

    if (!audioCheck.hasAudio) {
      return {
        success: false,
        errorType: 'EMPTY_FOLDER',
        message: 'No supported audio files found',
      };
    }

    // Success - generate preview URL
    return {
      success: true,
      previewUrl: `https://boomtap.app/kits/gdrive:${driveId}`,
      metadata: {
        name: metadataResult.metadata!.name,
        fileType: fileType,
        audioFileCount: audioCheck.audioCount,
      },
    };
  } catch (error) {
    console.error(`Drive validation error: ${error}`);
    return {
      success: false,
      errorType: 'API_ERROR',
      message: 'Failed to validate Google Drive link',
    };
  }
}

/**
 * Fetch basic Google Drive file/folder metadata
 *
 * @param driveId - Google Drive file/folder ID
 * @param apiKey - Google Drive API key
 * @param requestOrigin - Origin URL for Referer header
 * @returns MetadataResult with success status and metadata or error type
 */
async function fetchDriveMetadata(
  driveId: string,
  apiKey: string,
  requestOrigin: string
): Promise<MetadataResult> {
  try {
    const url = `${DRIVE_API_BASE}/files/${driveId}?key=${apiKey}&fields=id,name,mimeType,size`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Referer': requestOrigin,
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (response.status === 404) {
      return { success: false, errorType: 'INVALID_LINK' };
    } else if (response.status === 403) {
      return { success: false, errorType: 'PRIVATE_LINK' };
    } else if (!response.ok) {
      console.warn(`Drive API returned status ${response.status}`);
      return { success: false, errorType: 'API_ERROR' };
    }

    const data = await response.json() as DriveMetadata;
    return { success: true, metadata: data };
  } catch (error: any) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      console.warn(`Timeout fetching metadata for drive_id: ${driveId}`);
      return { success: false, errorType: 'TIMEOUT' };
    }
    console.error(`Error fetching metadata: ${error}`);
    return { success: false, errorType: 'API_ERROR' };
  }
}

/**
 * Detect if this is a folder, ZIP, or single file
 *
 * @param metadata - Google Drive file metadata from API
 * @returns File type string: 'folder', 'zip', or 'file'
 */
function detectFileType(metadata: DriveMetadata): 'folder' | 'zip' | 'file' {
  const mimeType = metadata.mimeType || '';

  if (mimeType === 'application/vnd.google-apps.folder') {
    return 'folder';
  } else if (metadata.name.toLowerCase().endsWith('.zip')) {
    return 'zip';
  } else {
    return 'file';
  }
}

/**
 * Check for supported audio files based on file type
 *
 * For folders: Query Google Drive API to list files and count audio files
 * For ZIP files: Assume valid (webapp will validate contents)
 * For single files: Check if the file extension is an audio format
 *
 * @param driveId - Google Drive file/folder ID
 * @param fileType - Type of Drive item ('folder', 'zip', or 'file')
 * @param apiKey - Google Drive API key
 * @param requestOrigin - Origin URL for Referer header
 * @param metadata - Optional metadata dict for single files
 * @returns AudioCheckResult with audio presence and count
 */
async function checkAudioContent(
  driveId: string,
  fileType: 'folder' | 'zip' | 'file',
  apiKey: string,
  requestOrigin: string,
  metadata?: DriveMetadata
): Promise<AudioCheckResult> {
  if (fileType === 'folder') {
    return await checkFolderAudioContent(driveId, apiKey, requestOrigin);
  } else if (fileType === 'zip') {
    // For ZIP files, assume they contain audio
    // Conservative approach: allow ZIPs through, let webapp handle detailed validation
    return { hasAudio: true, audioCount: 1 }; // Placeholder count
  } else {
    // Single file - check if it's an audio file
    return checkSingleFileAudio(metadata);
  }
}

/**
 * Check a Google Drive folder for audio files
 *
 * @param folderId - Google Drive folder ID
 * @param apiKey - Google Drive API key
 * @param requestOrigin - Origin URL for Referer header
 * @returns AudioCheckResult with audio presence and count
 */
async function checkFolderAudioContent(
  folderId: string,
  apiKey: string,
  requestOrigin: string
): Promise<AudioCheckResult> {
  try {
    const filesUrl = `${DRIVE_API_BASE}/files?q='${folderId}'+in+parents&key=${apiKey}&fields=files(name)&pageSize=100`;

    const response = await fetch(filesUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Referer': requestOrigin,
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      console.warn(`Failed to list folder contents: ${response.status}`);
      return { hasAudio: false, audioCount: 0 };
    }

    const filesData = await response.json() as { files: Array<{ name: string }> };
    const files = filesData.files || [];

    // Count audio files by extension
    const audioCount = files.filter(f =>
      AUDIO_FORMATS.some(ext => f.name.toLowerCase().endsWith(`.${ext}`))
    ).length;

    return {
      hasAudio: audioCount > 0,
      audioCount: audioCount,
    };
  } catch (error: any) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      console.warn(`Timeout checking folder contents for: ${folderId}`);
    } else {
      console.error(`Error checking folder contents: ${error}`);
    }
    return { hasAudio: false, audioCount: 0 };
  }
}

/**
 * Check if a single file is an audio file
 *
 * @param metadata - File metadata containing name
 * @returns AudioCheckResult with audio presence and count
 */
function checkSingleFileAudio(metadata?: DriveMetadata): AudioCheckResult {
  if (!metadata) {
    return { hasAudio: false, audioCount: 0 };
  }

  const filename = metadata.name.toLowerCase();
  const isAudio = AUDIO_FORMATS.some(ext => filename.endsWith(`.${ext}`));

  return {
    hasAudio: isAudio,
    audioCount: isAudio ? 1 : 0,
  };
}

/**
 * Get human-readable error message for error type
 *
 * @param errorType - Error type string
 * @returns Human-readable error message
 */
function getErrorMessage(errorType?: string): string {
  switch (errorType) {
    case 'INVALID_LINK':
      return 'File or folder not found';
    case 'PRIVATE_LINK':
      return 'File or folder is private or not accessible';
    case 'EMPTY_FOLDER':
      return 'No supported audio files found';
    case 'TIMEOUT':
      return 'Request timed out';
    case 'API_ERROR':
      return 'API error occurred';
    default:
      return 'Unknown error';
  }
}
