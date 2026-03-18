import { XMLParser } from "fast-xml-parser";
import { IDipParser } from "./IDipParser";
import { DiPIndexXml } from "../../xml-types/DiPIndexXml";
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

  public parseDipIndex(rawContent: string): DiPIndexXml {
    const parsed = this.parser.parse(rawContent);
    const root = parsed.DiPIndex;
    if (!root) {
      throw new Error("Invalid DiPIndex XML: missing root element 'DiPIndex'");
    }
    return root as DiPIndexXml;
  }

  public parseDocumentMetadata(rawContent: string): Metadata[] {
    const parsed = this.parser.parse(rawContent);
    const root =
      parsed.Document[0].DocumentDocumentoAmministrativoInformatico ||
      parsed.Document[0].DocumentoInformatico ||
      parsed.Document[0].AggregazioneDocumentaliInformatiche;
    if (!root) {
      throw new Error("Invalid metadata XML: missing expected root element");
    }
    return Object.entries(root)
      .filter(([key]) => key !== "@_uuid") // Exclude the uuid attribute
      .map(([key, value]) => {
        let valueType: MetadataType;
        if (typeof value === "number") {
          valueType = MetadataType.Number;
        } else if (typeof value === "boolean") {
          valueType = MetadataType.Boolean;
        } else {
          valueType = MetadataType.String;
        }
        return new Metadata(key, String(value), valueType);
      });
  }
}
