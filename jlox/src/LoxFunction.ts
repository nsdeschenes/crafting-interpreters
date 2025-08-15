import * as Sentry from "@sentry/bun";

import { Environment } from "./Environment";
import type { Interpreter } from "./Interpreter";
import type { LoxCallable } from "./LoxCallable";
import { Return } from "./Return";
import type { StmtFunction } from "./Stmt";
import type { TypeOrNull } from "./types";

export class LoxFunction implements LoxCallable {
  private declaration: StmtFunction;
  private closure: Environment;

  constructor(declaration: StmtFunction, closure: Environment) {
    this.closure = closure;
    this.declaration = declaration;
  }

  public arity(): number {
    return Sentry.startSpan({ name: "LoxFunction.arity." }, () => {
      return this.declaration.params.length;
    });
  }

  public call(
    interpreter: Interpreter,
    args: TypeOrNull<Object>[]
  ): TypeOrNull<Object> {
    return Sentry.startSpan({ name: "LoxFunction.call." }, () => {
      const environment = new Environment(this.closure);

      for (let i = 0; i < this.declaration.params.length; i++) {
        environment.define(this.declaration.params[i].lexeme, args[i]);
      }

      try {
        interpreter.executeBlock(this.declaration.body, environment);
      } catch (returnValue) {
        // console.log('returnValue', returnValue)
        if (returnValue instanceof Return) {
          return returnValue.value;
        }
      }

      return null;
    });
  }

  public toString(): string {
    return `<fn ${this.declaration.name.lexeme}>`;
  }
}
