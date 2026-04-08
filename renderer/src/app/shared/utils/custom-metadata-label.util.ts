const NOISY_PREFIXES = new Set([
  'process',
  'processo',
  'root',
  'metadata',
  'custommetadata',
  'archimemodata',
]);

const GENERIC_LAST_SEGMENTS = new Set([
  'date',
  'datetime',
  'time',
  'timestamp',
  'id',
  'uuid',
  'code',
  'name',
  'type',
  'value',
  'status',
  'number',
]);

/**
 * Reduces noisy metadata paths to a compact label focused on the useful tail.
 * Examples:
 * - Process.End.Date -> End.Date
 * - Process.PreservationSession.DocumentsStats.DocumentsFilesCount -> DocumentsFilesCount
 */
export function simplifyCustomMetadataLabel(fieldName: string): string {
  const normalized = fieldName.trim();
  if (normalized.length === 0) {
    return '';
  }

  let segments = normalized
    .split('.')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  while (segments.length > 1 && NOISY_PREFIXES.has(segments[0].toLowerCase())) {
    segments = segments.slice(1);
  }

  if (segments.length <= 1) {
    return segments[0] || normalized;
  }

  const last = segments[segments.length - 1];
  if (GENERIC_LAST_SEGMENTS.has(last.toLowerCase())) {
    return `${segments[segments.length - 2]}.${last}`;
  }

  return last;
}
