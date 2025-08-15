import { Interpreter } from "./Interpreter";
import type { TypeOrNull } from "./types";

export interface LoxCallable {
  call(interpreter: Interpreter, args: TypeOrNull<Object>[]): any;

  arity(): number;

  toString(): string;
}

export function isLoxCallable(
  callee: TypeOrNull<Object>
): callee is LoxCallable {
  if (callee === null) return false;

  const hasCall = "call" in callee && typeof callee.call === "function";
  const hasArity = "arity" in callee && typeof callee.arity === "function";
  const hasToString =
    "toString" in callee && typeof callee.toString === "function";

  return hasCall && hasArity && hasToString;
}
