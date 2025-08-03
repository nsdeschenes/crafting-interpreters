import { Token } from "./Token";
import { type TTokenType, TokenType } from "./TokenType";
import { Lox } from "./Lox";

export class Scanner {
  private source: string;
  private tokens: Token[] = [];
  private start: number = 0;
  private current: number = 0;
  private line: number = 0;

  constructor(source: string) {
    this.source = source;
  }

  private static keywords: Map<string, TTokenType>;

  static {
    this.keywords = new Map();
    this.keywords.set("and", TokenType.AND);
    this.keywords.set("class", TokenType.CLASS);
    this.keywords.set("else", TokenType.ELSE);
    this.keywords.set("false", TokenType.FALSE);
    this.keywords.set("for", TokenType.FOR);
    this.keywords.set("fun", TokenType.FUN);
    this.keywords.set("if", TokenType.IF);
    this.keywords.set("nil", TokenType.NIL);
    this.keywords.set("or", TokenType.OR);
    this.keywords.set("print", TokenType.PRINT);
    this.keywords.set("return", TokenType.RETURN);
    this.keywords.set("super", TokenType.SUPER);
    this.keywords.set("this", TokenType.THIS);
    this.keywords.set("true", TokenType.TRUE);
    this.keywords.set("var", TokenType.VAR);
    this.keywords.set("while", TokenType.WHILE);
  }

  public scanTokens(): Token[] {
    while (!this.isAtEnd()) {
      // We are at the beginning of the next lexeme.
      this.start = this.current;
      this.scanToken();
    }

    this.tokens.push(new Token(TokenType.EOF, "", null, this.line));
    return this.tokens;
  }

  private scanToken(): void {
    const c = this.advance();
    switch (c) {
      case "(":
        this.addToken(TokenType.LEFT_PAREN, undefined);
        break;
      case ")":
        this.addToken(TokenType.RIGHT_PAREN, undefined);
        break;
      case "{":
        this.addToken(TokenType.LEFT_BRACE, undefined);
        break;
      case "}":
        this.addToken(TokenType.RIGHT_BRACE, undefined);
        break;
      case ",":
        this.addToken(TokenType.COMMA, undefined);
        break;
      case ".":
        this.addToken(TokenType.DOT, undefined);
        break;
      case "-":
        this.addToken(TokenType.MINUS, undefined);
        break;
      case "+":
        this.addToken(TokenType.PLUS, undefined);
        break;
      case ";":
        this.addToken(TokenType.SEMICOLON, undefined);
        break;
      case "*":
        this.addToken(TokenType.STAR, undefined);
        break;
      case "!":
        this.addToken(
          this.match("=") ? TokenType.BANG_EQUAL : TokenType.BANG,
          undefined
        );
        break;
      case "=":
        this.addToken(
          this.match("=") ? TokenType.EQUAL_EQUAL : TokenType.EQUAL,
          undefined
        );
        break;
      case "<":
        this.addToken(
          this.match("=") ? TokenType.LESS_EQUAL : TokenType.LESS,
          undefined
        );
        break;
      case ">":
        this.addToken(
          this.match("=") ? TokenType.GREATER_EQUAL : TokenType.GREATER,
          undefined
        );
        break;
      case "/":
        if (this.match("/")) {
          // A comment goes until the end of the line.
          while (this.peek() != "\n" && !this.isAtEnd()) this.advance();
        } else {
          this.addToken(TokenType.SLASH, undefined);
        }
        break;
      case " ":
      case "\r":
      case "\t":
        // Ignore whitespace.
        break;
      case "\n":
        this.line++;
        break;
      case '"':
        this.string();
        break;
      default:
        if (this.isDigit(c)) {
          this.number();
        } else if (this.isAlpha(c)) {
          this.identifier();
        } else {
          Lox.error(this.line, "Unexpected character.");
        }
        break;
    }
  }

  private identifier(): void {
    while (this.isAlphaNumeric(this.peek())) {
      this.advance();
    }

    const text: string = this.source.substring(this.start, this.current);
    let type: TTokenType | undefined = Scanner.keywords.get(text);
    if (!type) {
      type = TokenType.IDENTIFIER;
    }
    this.addToken(type, undefined);
  }

  private number(): void {
    while (this.isDigit(this.peek())) {
      this.advance();
    }

    // Look for a fractional part.
    if (this.peek() == "." && this.isDigit(this.peekNext())) {
      // Consume the "."
      this.advance();

      while (this.isDigit(this.peek())) {
        this.advance();
      }
    }

    this.addToken(
      TokenType.NUMBER,
      parseFloat(this.source.substring(this.start, this.current))
    );
  }

  private string(): void {
    while (this.peek() !== '"' && !this.isAtEnd()) {
      if (this.peek() == "\n") {
        this.line++;
      }
      this.advance();
    }

    if (this.isAtEnd()) {
      Lox.error(this.line, "Unterminated string.");
      return;
    }

    // The closing "."
    this.advance();

    // Trim the surrounding quotes.
    const value: string = this.source.substring(
      this.start + 1,
      this.current - 1
    );
    this.addToken(TokenType.STRING, value);
  }

  private match(expected: string): boolean {
    if (this.isAtEnd()) {
      return false;
    } else if (this.source.charAt(this.current) != expected) {
      return false;
    }
    this.current++;
    return true;
  }

  private peek(): string {
    if (this.isAtEnd()) {
      return "\0";
    }
    return this.source.charAt(this.current);
  }

  private peekNext(): string {
    if (this.current + 1 >= this.source.length) {
      return "\0";
    }
    return this.source.charAt(this.current + 1);
  }

  private isAlpha(c: string) {
    return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c === "_";
  }

  private isAlphaNumeric(c: string) {
    return this.isAlpha(c) || this.isDigit(c);
  }

  private isDigit(c: string): boolean {
    return c >= "0" && c <= "9";
  }

  private isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  private advance(): string {
    return this.source.charAt(this.current++);
  }

  private addToken(type: TTokenType, b: undefined): void;
  private addToken(type: TTokenType, literal: {} | null): void;

  private addToken(type: TTokenType, literal: {} | null | undefined) {
    if (typeof literal === "undefined") {
      this.addToken(type, null);
    } else {
      const text: string = this.source.substring(this.start, this.current);
      this.tokens.push(new Token(type, text, literal, this.line));
    }
    return;
  }
}
