import type { LoxClass } from "./LoxClass";
import { RuntimeError } from "./RuntimeError";
import type { Token } from "./Token";
import type { TypeOrNull } from "./types";

export class LoxInstance {
  private klass: LoxClass;
  private fields = new Map<string, TypeOrNull<Object>>();

  constructor(klass: LoxClass) {
    this.klass = klass;
  }

  public get(name: Token): TypeOrNull<Object> {
    const value = this.fields.get(name.lexeme);
    if (value) return value;

    const method = this.klass.findMethod(name.lexeme);
    if (method !== null) return method.bind(this);

    throw new RuntimeError(name, `Undefined property '${name.lexeme}'.`);
  }

  public set(name: Token, value: TypeOrNull<Object>): void {
    this.fields.set(name.lexeme, value);
  }

  public toString(): string {
    return `${this.klass.name} instance`;
  }
}
