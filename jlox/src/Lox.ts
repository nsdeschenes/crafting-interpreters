import nodeFs from "node:fs";
import nodeReadline from "node:readline";
import { Scanner } from "./Scanner";
import type { Token } from "./Token";

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

    // For now just print the tokens
    for (const token of tokens) {
      console.log(token.toString());
    }
  }

  public static error(line: number, message: string): void {
    Lox.report(line, "", message);
  }

  private static report(line: number, where: string, message: string) {
    console.error(`[line ${line}] Error ${where}: ${message}`);
    this.hadError = true;
  }
}

Lox.main();
