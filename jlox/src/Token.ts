import { type TTokenType } from "./TokenType";

export class Token {
  type: TTokenType;
  lexeme: string;
  literal: {} | null;
  line: number;

  constructor(
    type: TTokenType,
    lexeme: string,
    literal: {} | null,
    line: number
  ) {
    this.type = type;
    this.lexeme = lexeme;
    this.literal = literal;
    this.line = line;
  }

  public toString(): string {
    return `Type: ${this.type}, Lexeme: ${this.lexeme}, Literal: ${this.literal}`;
  }
}
