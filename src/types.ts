export type Provider = 'google_drive' | 'dropbox' | 'mediafire';

export type FailureType =
  | 'PRIVATE_LINK'
  | 'INVALID_LINK'
  | 'NO_AUDIO'
  | 'NEEDS_REVIEW';

export type ValidationStatus = 'PASS' | 'FAIL' | 'ERROR';

export interface ValidationResult {
  status: ValidationStatus;
  failureType?: FailureType;
  message?: string;
}

export interface ProviderValidator {
  validate(url: string, apiKey?: string): Promise<ValidationResult>;
}
