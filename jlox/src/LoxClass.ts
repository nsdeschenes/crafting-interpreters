import type { Interpreter } from "./Interpreter";
import type { LoxCallable } from "./LoxCallable";
import type { LoxFunction } from "./LoxFunction";
import { LoxInstance } from "./LoxInstance";
import type { TypeOrNull } from "./types";

export class LoxClass implements LoxCallable {
  public name: string;
  superclass: LoxClass;
  private methods: Map<string, LoxFunction>;

  constructor(
    name: string,
    superclass: LoxClass,
    methods: Map<string, LoxFunction>
  ) {
    this.name = name;
    this.superclass = superclass;
    this.methods = methods;
  }

  public findMethod(name: string): TypeOrNull<LoxFunction> {
    const method = this.methods.get(name);
    if (method) return method;

    if (this.superclass !== null) {
      return this.superclass.findMethod(name);
    }

    return null;
  }

  public toString(): string {
    return this.name;
  }

  public call(
    interpreter: Interpreter,
    args: Array<TypeOrNull<Object>>
  ): TypeOrNull<Object> {
    const instance = new LoxInstance(this);
    const initializer = this.findMethod("init");
    if (initializer !== null) {
      initializer.bind(instance).call(interpreter, args);
    }

    return instance;
  }

  public arity(): number {
    const initializer = this.findMethod("init");
    if (initializer === null) return 0;
    return initializer.arity();
  }
}
