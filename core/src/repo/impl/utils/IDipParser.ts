import { Metadata } from "../../../value-objects/Metadata";
import { DiPIndexXml } from "../../xml-types/DiPIndexXml";

export const DIP_INDEX_PARSER_TOKEN = Symbol("IDiPIndexParser");

/**
 * Internal abstraction for parsing the DiPIndex file.
 * Not a hexagonal port — this is an implementation detail of
 * LocalPackageReaderAdapter that allows swapping the format
 * (e.g. XML, JSON) without changing the adapter or the domain.
 */
export interface IDipParser {
  parseDipIndex(rawContent: string): DiPIndexXml;
  parseDocumentMetadata(rawContent: string): Metadata[];
}
