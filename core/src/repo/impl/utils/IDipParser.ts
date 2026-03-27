export const DIP_PARSER_TOKEN = Symbol("IDipParser");

export interface IDipParser {
  parse(rawContent: string): any;
}
