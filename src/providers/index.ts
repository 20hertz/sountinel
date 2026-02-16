import type { Provider, ValidationResult } from '../types.js';
import { validateGoogleDrive } from './googleDrive.js';
import { validateDropbox } from './dropbox.js';
import { validateMediafire } from './mediafire.js';

export function identifyProvider(url: string): Provider | null {
  if (!url) return null;
  if (/drive\.google\.com/.test(url)) return 'google_drive';
  if (/dropbox\.com/.test(url)) return 'dropbox';
  if (/mediafire\.com/.test(url)) return 'mediafire';
  // docs.google.com is intentionally excluded — not a valid kit host
  return null;
}

// Providers with approved fetch domains — others skip validation and go to mod queue
const VALIDATED_PROVIDERS: Set<Provider> = new Set(['google_drive']);

export async function validateLink(
  provider: Provider,
  url: string,
  apiKey?: string,
): Promise<ValidationResult> {
  if (!VALIDATED_PROVIDERS.has(provider)) {
    return { status: 'ERROR', failureType: 'NEEDS_REVIEW', message: `${provider} validation pending domain approval` };
  }

  switch (provider) {
    case 'google_drive':
      return validateGoogleDrive(url, apiKey);
    case 'dropbox':
      return validateDropbox(url);
    case 'mediafire':
      return validateMediafire(url);
  }
}
