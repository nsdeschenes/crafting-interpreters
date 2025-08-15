import type { TypeOrNull } from "./types";

export class Return extends Error {
  value: TypeOrNull<Object>;

  constructor(value: TypeOrNull<Object>) {
    super();
    this.value = value;
  }
}