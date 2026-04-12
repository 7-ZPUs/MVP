import { XmlDipParser } from "../../../../src/repo/impl/utils/XmlDipParser";

const exampleXml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  "<simpleNode>exampleText</simpleNode>" +
  "<nestedNode><childNode>childText</childNode><childNode>child2Text</childNode></nestedNode>";

describe("XmlDipParser", () => {
  // identifier: TU-F-indexing-80
  // method_name: parse()
  // description: should correctly parse metadata from XML structure
  // expected_value: matches asserted behavior: correctly parse metadata from XML structure
  it("TU-F-indexing-80: parse() should correctly parse metadata from XML structure", () => {
    const xmlParser = new XmlDipParser();
    const parsedObj = xmlParser.parse(exampleXml);
    expect(parsedObj.simpleNode).toBe("exampleText");
    expect(parsedObj.nestedNode.childNode).toEqual(["childText", "child2Text"]);
  });

  it("TU-F-indexing-81: parse() should return an empty object for empty XML", () => {
    const xmlParser = new XmlDipParser();
    const parsedObj = xmlParser.parse("");
    expect(parsedObj).toEqual({});
  });

  it("TU-F-indexing-82: parse() should handle XML with attributes", () => {
    const xmlWithAttributes = '<node attr="value">text</node>';
    const xmlParser = new XmlDipParser();
    const parsedObj = xmlParser.parse(xmlWithAttributes);
    expect(parsedObj.node["#text"]).toBe("text");
  });
});
