import { RuntimeError } from "./RuntimeError";
import type { Token } from "./Token";
import type { TypeOrNull } from "./types";

export class Environment {
  enclosing: TypeOrNull<Environment>;
  private values = new Map<string, TypeOrNull<Object>>();

  constructor(enclosing?: Environment) {
    this.enclosing = enclosing ?? null;
  }

  public define(name: string, value: TypeOrNull<Object>): void {
    this.values.set(name, value);
  }

  public get(name: Token): TypeOrNull<Object> {
    const value = this.values.get(name.lexeme);
    if (value) {
      return value;
    }

    if (this.enclosing !== null) return this.enclosing.get(name);

    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
  }

  public assign(name: Token, value: TypeOrNull<Object>): void {
    if (this.values.has(name.lexeme)) {
      this.values.set(name.lexeme, value);
      return;
    }

    if (this.enclosing !== null) {
      this.enclosing.assign(name, value);
      return;
    }

    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
  }
}
