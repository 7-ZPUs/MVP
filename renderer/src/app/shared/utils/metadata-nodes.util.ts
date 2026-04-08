export interface MetadataNode {
  name: string;
  value: unknown;
}

function isMetadataNode(value: unknown): value is MetadataNode {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    typeof (value as { name?: unknown }).name === 'string' &&
    'value' in value
  );
}

export function normalizeMetadataNodes(metadata: unknown): MetadataNode[] {
  if (Array.isArray(metadata)) {
    return metadata.filter(isMetadataNode);
  }

  if (
    metadata &&
    typeof metadata === 'object' &&
    'value' in metadata &&
    Array.isArray((metadata as { value?: unknown }).value)
  ) {
    return (metadata as { value: unknown[] }).value.filter(isMetadataNode);
  }

  return [];
}
