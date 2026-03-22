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
    return Object.entries(root)
      .filter(([key]) => key !== "@_uuid") // Exclude the uuid attribute
      .map(([key, value]) => {
        let valueType: MetadataType;
        if (typeof value === "number") {
          valueType = MetadataType.NUMBER;
        } else if (typeof value === "boolean") {
          valueType = MetadataType.BOOLEAN;
        } else {
          valueType = MetadataType.STRING;
        }
        return new Metadata(key, String(value), valueType);
      });
  }
}
