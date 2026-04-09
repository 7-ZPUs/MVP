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

function splitCompoundLabel(value: string): string {
  return value
    .replaceAll(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replaceAll(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replaceAll(/[._-]+/g, ' ')
    .replaceAll(/\s+/g, ' ')
    .trim();
}

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
    return splitCompoundLabel(segments[0] || normalized);
  }

  const last = segments[segments.length - 1];
  if (GENERIC_LAST_SEGMENTS.has(last.toLowerCase())) {
    return splitCompoundLabel(`${segments[segments.length - 2]}.${last}`);
  }

  return splitCompoundLabel(last);
}

export function toTestIdSuffix(value: string): string {
  return value.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-').replaceAll(/(^-|-$)/g, '');
}