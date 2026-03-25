import { XMLParser } from "fast-xml-parser";
import { IDipParser, ParsedDipIndex } from "./IDipParser";
import { DipIndexXml } from "../../xml-types/DipIndexXml";
import { Metadata, MetadataType } from "../../../value-objects/Metadata";
import { DipIndexMapper } from "./DipIndexMapper";

export class XmlDipParser implements IDipParser {
  private readonly parser: XMLParser;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      textNodeName: "#text",
      isArray: (name) => {
        const alwaysArray = new Set([
          "ComplianceStatement",
          "DocumentClass",
          "AiP",
          "Document",
          "Report",
          "SiP",
          "Attachments",
          "Statement",
          "Content",
          "MoreData",
          "RappresentationInformationUUID",
          "RepresentationInformation",
        ]);
        return alwaysArray.has(name);
      },
      parseTagValue: true,
      trimValues: true,
    });
  }

  public parseDipIndex(rawContent: string): ParsedDipIndex {
    const parsed = this.parser.parse(rawContent);
    const root = parsed.DiPIndex;
    if (!root) {
      throw new Error("Invalid DiPIndex XML: missing root element 'DiPIndex'");
    }
    const mapper = new DipIndexMapper(root as DipIndexXml);
    return {
      dipUuid: mapper.extractDipUuid(),
      documentClasses: mapper.extractDocumentClasses().map((dc) => ({
        uuid: dc["@_uuid"],
        name: dc["@_name"],
        timestamp: dc["@_validFrom"],
      })),
      processes: mapper.extractProcesses(),
      documents: mapper.extractDocuments(),
      files: mapper.extractFiles(),
    };
  }

  public parseDocumentMetadata(rawContent: string): Metadata[] {
    const parsed = this.parser.parse(rawContent);
    if (!parsed.Document?.[0]) {
      throw new Error("Invalid metadata XML: missing expected root element");
    }
    const root =
      parsed.Document[0].DocumentDocumentoAmministrativoInformatico ||
      parsed.Document[0].DocumentoInformatico ||
      parsed.Document[0].AggregazioneDocumentaliInformatiche;

    const extractMetadata = (obj: any): Metadata[] => {
      return Object.entries(obj)
        .filter(([key]) => key !== "@_uuid")
        .flatMap(([key, value]) => {
          if (value === null || value === undefined) {
            return [];
          }

          if (Array.isArray(value)) {
            return value.flatMap((item) => {
              if (typeof item === "object") {
                const nested = extractMetadata(item);
                return [new Metadata(key, nested, MetadataType.COMPOSITE)];
              }
              return [new Metadata(key, String(item), this.getMetadataType(item))];
            });
          }

          if (typeof value === "object") {
            const nested = extractMetadata(value);
            if (nested.length === 0) return [];
            return [new Metadata(key, nested, MetadataType.COMPOSITE)];
          }

          return [new Metadata(key, String(value), this.getMetadataType(value))];
        });
    };

    return extractMetadata(root);
  }

  public parseProcessMetadata(rawContent: string): Metadata[] {
    const parsed = this.parser.parse(rawContent);
    const root = parsed.AiPInfo;
    if (!root) {
      throw new Error("Invalid metadata XML: missing expected root element");
    }

    const extractMetadata = (obj: any): Metadata[] => {
      return Object.entries(obj).flatMap(([key, value]) => {
        if (value === null || value === undefined) {
          return [];
        }

        if (Array.isArray(value)) {
          const nestedList = value.flatMap((item) => {
            if (typeof item === "object" && item !== null) {
              return extractMetadata(item);
            }
            return [new Metadata(key, String(item), this.getMetadataType(item))];
          });
          return [new Metadata(key, nestedList, MetadataType.COMPOSITE)];
        }

        if (typeof value === "object" && value !== null) {
          const nested = extractMetadata(value);
          if (nested.length > 0) {
            return [new Metadata(key, nested, MetadataType.COMPOSITE)];
          }
          return [];
        }

        let type = MetadataType.STRING;
        if (typeof value === "number") type = MetadataType.NUMBER;
        if (typeof value === "boolean") type = MetadataType.BOOLEAN;

        return [new Metadata(key, String(value), type)];
      });
    };

    return extractMetadata(root);
  }

  private getMetadataType(value: any): MetadataType {
      if (typeof value === "number") return MetadataType.NUMBER;
      if (typeof value === "boolean") return MetadataType.BOOLEAN;
      return MetadataType.STRING;
  }
}
