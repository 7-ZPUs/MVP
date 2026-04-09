import { MetadataNode } from './metadata-nodes.util';

export class MetadataExtractor {
  constructor(private readonly metadataNodes: MetadataNode[]) {}

  /**
   * Deeply search for the first metadata node whose name matches `pathName`
   */
  public findValue(pathName: string, nodes: unknown[] = this.metadataNodes): unknown {
    if (!nodes || !Array.isArray(nodes)) return undefined;
    for (const node of nodes) {
      if (typeof node === 'object' && node !== null && 'name' in node && 'value' in node) {
        if (node.name === pathName) {
          return node.value;
        }
        if (Array.isArray(node.value)) {
          const found = this.findValue(pathName, node.value);
          if (found !== undefined) return found;
        }
      }
    }
    return undefined;
  }

  /**
   * Returns all matching values for the specified node name
   */
  public findAllValues(
    pathName: string,
    nodes: unknown[] = this.metadataNodes,
    results: unknown[] = [],
  ): unknown[] {
    if (!nodes || !Array.isArray(nodes)) return results;
    for (const node of nodes) {
      if (typeof node === 'object' && node !== null && 'name' in node && 'value' in node) {
        if (node.name === pathName) {
          results.push(node.value);
        }
        if (Array.isArray(node.value)) {
          this.findAllValues(pathName, node.value, results);
        }
      }
    }
    return results;
  }

  /**
   * Safe string getter with fallback
   */
  public getString(key: string, defaultVal = ''): string {
    const val = this.findValue(key);
    return val !== undefined && val !== null ? String(val) : defaultVal;
  }

  /**
   * Safe number getter with fallback
   */
  public getNumber(key: string, defaultVal = 0): number {
    const val = this.findValue(key);
    const parsed = Number(val);
    return !isNaN(parsed) ? parsed : defaultVal;
  }

  /**
   * Used to extract generic Custom and Archimemo data that act as key value pairs
   */
  public extractCustomDataPairs(
    nodeNames: string[] = ['CustomMetadata', 'ArchimemoData'],
  ): { nome: string; valore: string }[] {
    const pairs: { nome: string; valore: string }[] = [];
    for (const name of nodeNames) {
      const nodeBlock = this.metadataNodes.find((m) => m.name === name);
      if (nodeBlock && Array.isArray(nodeBlock.value)) {
        for (const prop of nodeBlock.value) {
          if (
            typeof prop === 'object' &&
            prop !== null &&
            'value' in prop &&
            'name' in prop &&
            (typeof (prop as MetadataNode).value === 'string' ||
              typeof (prop as MetadataNode).value === 'number')
          ) {
            pairs.push({
              nome: String((prop as MetadataNode).name),
              valore: String((prop as MetadataNode).value),
            });
          }
        }
      }
    }
    return pairs;
  }

  /**
   * Iterates through the entire metadata tree.
   * If a node branch isn't in 'knownXsdSchemaTags', it collapses those structures into flattened key values.
   * This is fantastic for unbridled / unverified metadata properties appended outside the standard XML.
   */
  public extractGenericUnmappedCustomMetadata(
    knownXsdSchemaTags: Set<string>,
  ): { nome: string; valore: string }[] {
    const pairs: { nome: string; valore: string }[] = [];

    const traverse = (nodes: unknown[], pathName = '', rootLevel = true) => {
      if (!nodes || !Array.isArray(nodes)) return;

      for (const node of nodes) {
        if (typeof node !== 'object' || node === null || !('name' in node) || !('value' in node))
          continue;

        const mNode = node as MetadataNode;

        // Skip explicitly known standard core XSD blocks so we don't duplicate them as 'custom' metadata
        if (rootLevel && knownXsdSchemaTags.has(mNode.name)) {
          continue;
        }

        // If it's a known generic custom-data block (handled above), or we want to flatten it too?
        // Let's flatten everything not known!
        const currentPath = pathName ? `${pathName}.${mNode.name}` : mNode.name;

        if (Array.isArray(mNode.value)) {
          traverse(mNode.value, currentPath, false); // Deeper levels are not root level
        } else if (mNode.value !== null && mNode.value !== undefined) {
          pairs.push({
            nome: currentPath,
            valore: String(mNode.value),
          });
        }
      }
    };

    traverse(this.metadataNodes);
    return pairs;
  }
}
