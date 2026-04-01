export type IsoDateString = string; // ISO 8601 date string (e.g., "2024-06-01")

export type IsoTimestampString = string; // ISO 8601 timestamp string (e.g., "12:00:00")
// verification-status.type.ts
export type VerificationStatus = 'not_verified' | 'valid' | 'invalid';