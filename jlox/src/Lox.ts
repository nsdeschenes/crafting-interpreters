import nodeFs from "node:fs";
import nodeReadline from "node:readline";
import * as Sentry from "@sentry/bun";

import { Scanner } from "./Scanner";
import { Token } from "./Token";
import { TokenType } from "./TokenType";
import { Parser } from "./Parser";
import { AstPrinter } from "./AstPrinter";
import type { RuntimeError } from "./RuntimeError";
import { Interpreter } from "./Interpreter";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});

export class Lox {
  public static hadError: boolean = false;
  public static hadRuntimeError: boolean = false;
  private static interpreter: Interpreter = new Interpreter();

  constructor() {}

  public static main(): void {
    return Sentry.startSpan({ name: "Lox.main" }, () => {
      const args = process.argv.slice(2); // Get command-line arguments

      if (args.length > 1) {
        console.log("Usage: jlox [script]");
        process.exit(64);
      } else if (args.length === 1) {
        this.runFile(args[0]);
      } else {
        this.runPrompt();
      }
    });
  }

  private static runFile(path: string) {
    return Sentry.startSpan({ name: "Lox.runFile" }, () => {
      const bytes = nodeFs.readFileSync(path, "utf-8");
      this.run(bytes);

      // Indicate an error in the exit code.
      if (this.hadError) {
        process.exit(65);
      }

      if (this.hadRuntimeError) {
        process.exit(70);
      }
    });
  }

  private static runPrompt() {
    return Sentry.startSpan({ name: "Lox.runPrompt" }, () => {
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
    });
  }

  private static run(source: string): void {
    return Sentry.startSpan({ name: "Lox.run" }, () => {
      const scanner: Scanner = new Scanner(source);
      const tokens: Array<Token> = scanner.scanTokens();
      const parser: Parser = new Parser(tokens);
      const statements = parser.parse();

      if (this.hadError || statements === null) return;

      // console.log(new AstPrinter().print(expression));
      this.interpreter.interpret(statements);
    });
  }

  static error(input: number, message: string): void;
  static error(input: Token, message: string): void;

  public static error(input: number | Token, message: string): void {
    return Sentry.startSpan({ name: "Lox.error" }, () => {
      if (typeof input === "number") {
        return Lox.report(input, "", message);
      } else if (input instanceof Token) {
        if (input.type === TokenType.EOF) {
          Lox.report(input.line, " at end", message);
        } else {
          Lox.report(input.line, ` at '${input.lexeme}'`, message);
        }
      }
    });
  }

  public static runtimeError(error: RuntimeError) {
    return Sentry.startSpan({ name: "Lox.runtimeError" }, () => {
      console.error(`${error.message}\n[line ${error.token.line}]`);
      this.hadRuntimeError = true;
    });
  }

  private static report(line: number, where: string, message: string) {
    return Sentry.startSpan({ name: "Lox.report" }, () => {
      console.error(`[line ${line}] Error ${where}: ${message}`);
      this.hadError = true;
    });
  }
}

Lox.main();
