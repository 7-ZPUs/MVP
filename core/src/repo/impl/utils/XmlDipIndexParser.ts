import { XMLParser } from "fast-xml-parser";
import { IDiPIndexParser } from "./IDipIndexParser";
import { DiPIndexXml } from "../../xml-types/DiPIndexXml";

export class XmlDipIndexParser implements IDiPIndexParser {
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

  public parse(rawContent: string): DiPIndexXml {
    const parsed = this.parser.parse(rawContent);
    const root = parsed.DiPIndex;
    if (!root) {
      throw new Error("Invalid DiPIndex XML: missing root element 'DiPIndex'");
    }
    return root as DiPIndexXml;
  }
}
