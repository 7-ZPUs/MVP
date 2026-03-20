import { XMLParser } from "fast-xml-parser";
import { IDipParser } from "./IDipParser";
import { DipIndexXml } from "../../xml-types/DipIndexXml";
import { Metadata, MetadataType } from "../../../value-objects/Metadata";

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

  public parseDipIndex(rawContent: string): DipIndexXml {
    const parsed = this.parser.parse(rawContent);
    const root = parsed.DiPIndex;
    if (!root) {
      throw new Error("Invalid DiPIndex XML: missing root element 'DiPIndex'");
    }
    return root as DipIndexXml;
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
