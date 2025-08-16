import { RuntimeError } from "./RuntimeError";
import type { Token } from "./Token";
import type { TypeOrNull } from "./types";

export class Environment {
  enclosing: TypeOrNull<Environment>;
  public values = new Map<string, TypeOrNull<Object>>();

  constructor(enclosing?: Environment) {
    this.enclosing = enclosing ?? null;
  }

  public define(name: string, value: TypeOrNull<Object>): void {
    this.values.set(name, value);
  }

  public ancestor(distance: number): TypeOrNull<Environment> {
    let env: TypeOrNull<Environment> = this;
    for (let i = 0; i < distance; i++) {
      if (!env || !env.enclosing) return null;
      env = env.enclosing;
    }
    return env;
  }

  public getAt(distance: number, name: string): TypeOrNull<Object> {
    return this.ancestor(distance)?.values?.get(name) ?? null;
  }

  public assignAt(
    distance: number,
    name: Token,
    value: TypeOrNull<Object>
  ): void {
    this.ancestor(distance)?.values.set(name.lexeme, value);
  }

  public get(name: Token): TypeOrNull<Object> {
    const value = this.values.get(name.lexeme);
    if (value !== undefined) return value;
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
