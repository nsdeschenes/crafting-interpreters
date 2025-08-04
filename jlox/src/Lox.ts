import nodeFs from "node:fs";
import nodeReadline from "node:readline";
import { Scanner } from "./Scanner";
import { Token } from "./Token";
import { TokenType } from "./TokenType";
import { Parser } from "./Parser";
import { AstPrinter } from "./AstPrinter";

export class Lox {
  public static hadError: boolean = false;
  constructor() {}

  public static main(): void {
    const args = process.argv.slice(2); // Get command-line arguments

    if (args.length > 1) {
      console.log("Usage: jlox [script]");
      process.exit(64);
    } else if (args.length === 1) {
      this.runFile(args[0]);
    } else {
      this.runPrompt();
    }
  }

  private static runFile(path: string) {
    const bytes = nodeFs.readFileSync(path, "utf-8");
    this.run(bytes);

    // Indicate an error in the exit code.
    if (this.hadError) {
      process.exit(65);
    }
  }

  private static runPrompt() {
    const input = nodeReadline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    input.on("line", (line) => {
      if (line === null) {
        input.close();
        return;
      }
      this.run(line);
      this.hadError = false;
      input.prompt();
    });

    input.on("close", () => {
      process.exit(65);
    });

    input.prompt();
  }

  private static run(source: string): void {
    const scanner: Scanner = new Scanner(source);
    const tokens: Token[] = scanner.scanTokens();
    const parser: Parser = new Parser(tokens);
    const expression = parser.parse();

    if (this.hadError || expression === null) return;

    console.log(new AstPrinter().print(expression));
  }

  static error(input: number, message: string): void;
  static error(input: Token, message: string): void;

  public static error(input: number | Token, message: string): void {
    if (typeof input === "number") {
      return Lox.report(input, "", message);
    } else if (input instanceof Token) {
      if (input.type === TokenType.EOF) {
        Lox.report(input.line, " at end", message);
      } else {
        Lox.report(input.line, ` at '${input.lexeme}'`, message);
      }
    }
  }

  private static report(line: number, where: string, message: string) {
    console.error(`[line ${line}] Error ${where}: ${message}`);
    this.hadError = true;
  }
}

Lox.main();
