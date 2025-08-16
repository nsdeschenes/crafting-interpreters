import { Environment } from "./Environment";
import type { Interpreter } from "./Interpreter";
import type { LoxCallable } from "./LoxCallable";
import type { LoxInstance } from "./LoxInstance";
import { Return } from "./Return";
import type { StmtFunction } from "./Stmt";
import type { TypeOrNull } from "./types";

export class LoxFunction implements LoxCallable {
  private declaration: StmtFunction;
  private closure: Environment;
  private isInitializer: boolean;

  constructor(
    declaration: StmtFunction,
    closure: Environment,
    isInitializer: boolean
  ) {
    this.isInitializer = isInitializer;
    this.closure = closure;
    this.declaration = declaration;
  }

  public bind(instance: LoxInstance): LoxFunction {
    const environment = new Environment(this.closure);
    environment.define("this", instance);
    return new LoxFunction(this.declaration, environment, this.isInitializer);
  }

  public arity(): number {
    return this.declaration.params.length;
  }

  public call(
    interpreter: Interpreter,
    args: Array<TypeOrNull<Object>>
  ): TypeOrNull<Object> {
    const environment = new Environment(this.closure);

    for (let i = 0; i < this.declaration.params.length; i++) {
      environment.define(this.declaration.params[i].lexeme, args[i]);
    }

    try {
      interpreter.executeBlock(this.declaration.body, environment);
    } catch (returnValue) {
      if (returnValue instanceof Return) {
        if (this.isInitializer) return this.closure.getAt(0, "this");

        return returnValue.value;
      }
    }

    if (this.isInitializer) return this.closure.getAt(0, "this");
    return null;
  }

  public toString(): string {
    return `<fn ${this.declaration.name.lexeme}>`;
  }
}
