import { XMLParser } from "fast-xml-parser";
import { IDipParser } from "./IDipParser";

export class XmlDipParser implements IDipParser {
  private readonly parser: XMLParser;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      textNodeName: "#text",
      isArray: (name) => {
        const alwaysArray = new Set([
          "ComplianceStatement", "DocumentClass", "AiP", "Document", "Report", "SiP",
          "Attachments", "Statement", "Content", "MoreData", "RappresentationInformationUUID",
          "RepresentationInformation", "IndiceAllegati", "Documento", "DocumentoPrincipale", "Allegato", "UnitaDocumentaria", "Fascicolo"
        ]);
        return alwaysArray.has(name);
      },
      parseTagValue: true,
      trimValues: true,
    });
  }

  public parse(rawContent: string): any {
    return this.parser.parse(rawContent);
  }
}
