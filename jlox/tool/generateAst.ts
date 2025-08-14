import nodeFs from "node:fs";
import nodePath from "node:path";

const args = process.argv.slice(2);

if (args.length !== 1) {
  console.error("Usage: generate_ast <output directory>");
  process.exit(64);
}

function defineType(
  content: Array<string>,
  baseName: string,
  className: string,
  fieldList: string
) {
  content.push(`export class ${baseName}${className} extends ${baseName} {`);
  const fields = fieldList.split(", ");

  for (const field of fields) {
    const left = field.split(" ")[0];
    let right = field.split(" ")[1];

    if (right === "Object") right = "TypeOrNull<Object>";

    content.push(`  ${left}: ${right};`);
  }

  content.push("");

  const constructorArgs = fieldList
    .split(", ")
    .map((value) =>
      value
        .split(" ")
        .map((value) => (value === "Object" ? "TypeOrNull<Object>" : value))
        .join(": ")
    )
    .join(", ");

  content.push(`  constructor(${constructorArgs}) {`);
  content.push(`    super();`);
  for (const field of fields) {
    const name = field.split(" ")[0];
    content.push(`    this.${name} = ${name};`);
  }
  content.push(`  }`);
  content.push("");

  content.push(`  public override accept<R>(visitor: Visitor<R>) {`);
  content.push(`    return visitor.visit${className}${baseName}(this)`);
  content.push(`  }`);

  content.push(`}`);
  content.push("");
}

function defineVisitor(
  content: Array<string>,
  baseName: string,
  types: Array<string>
) {
  content.push("export interface Visitor<R> {");
  for (const type of types) {
    const typeName = type.split(":")[0].trim();
    content.push(
      `  visit${typeName}${baseName}(${baseName.toLowerCase()}: ${baseName}${typeName}): R;`
    );
  }

  content.push("}");
  content.push("");
}

function defineAst(outputDir: string, baseName: string, types: Array<string>) {
  const path = nodePath.resolve(`${outputDir}/${baseName}.ts`);
  const content: Array<string> = [];

  if (baseName === "Expr") {
    content.push(`import { Token } from "./Token";`);
    content.push(`import type { TypeOrNull } from './types';`);
  }

  if (baseName === "Stmt") {
    content.push(`import { Expr } from './Expr';`);
    content.push(`import { Token } from "./Token";`);
    content.push(`import type { TypeOrNull } from './types';`);
  }

  content.push("");

  content.push(`export abstract class ${baseName} {`);
  content.push(`  abstract accept<R>(visitor: Visitor<R>): R;`);
  content.push("}");
  content.push("");

  defineVisitor(content, baseName, types);

  for (const type of types) {
    const className = type.split(":")[0].trim();
    const fields = type.split(":")[1].trim();
    defineType(content, baseName, className, fields);
  }

  nodeFs.writeFileSync(path, content.join("\n"));
}

const outputDir = args[0];
defineAst(outputDir, "Expr", [
  "Assign   : name Token, value Expr",
  "Binary   : left Expr, operator Token, right Expr",
  "Grouping : expression Expr",
  "Literal  : value Object",
  "Logical  : left Expr, operator Token, right Expr",
  "Unary    : operator Token, right Expr",
  "Variable : name Token",
]);

defineAst(outputDir, "Stmt", [
  "Block      : statements Array<Stmt>",
  "Expression : expression Expr",
  "If         : condition Expr, thenBranch Stmt, elseBranch TypeOrNull<Stmt>",
  "Print      : expression Expr",
  "Var        : name Token, initializer TypeOrNull<Expr>",
  "While      : condition Expr, body Stmt",
]);
