import nodeFs from "node:fs";
import nodePath from "node:path";

const args = process.argv.slice(2);

if (args.length !== 1) {
  console.error("Usage: generate_ast <output directory>");
  process.exit(64);
}

function defineType(
  content: string[],
  baseName: string,
  className: string,
  fieldList: string
) {
  content.push(`export class ${className} extends ${baseName} {`);
  const fields = fieldList.split(", ");

  for (const field of fields) {
    const left = field.split(" ")[0];
    const right = field.split(" ")[1];
    content.push(`  ${left}: ${right};`);
  }

  content.push("");

  const constructorArgs = fieldList
    .split(", ")
    .map((value) => value.split(" ").join(": "))
    .join(", ");

  content.push(`  constructor(${constructorArgs}) {`);
  content.push(`    super()`);
  for (const field of fields) {
    const name = field.split(" ")[0];
    content.push(`    this.${name} = ${name};`);
  }
  content.push(`  }`);
  content.push("");

  content.push(`  override accept<R>(visitor: Visitor<R>) {`);
  content.push(`    return visitor.visit${className}${baseName}(this)`);
  content.push(`  }`);

  content.push(`}`);
  content.push("");
}

function defineVisitor(content: string[], baseName: string, types: string[]) {
  content.push("export interface Visitor<R> {");
  for (const type of types) {
    const typeName = type.split(":")[0].trim();
    content.push(
      `  visit${typeName}${baseName}(${baseName.toLowerCase()}: ${typeName}): R;`
    );
  }

  content.push("}");
  content.push("");
}

function defineAst(outputDir: string, baseName: string, types: string[]) {
  const path = nodePath.resolve(`${outputDir}/${baseName}.ts`);
  const content: string[] = [];

  content.push(`import { Token } from "./Token"`);
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
  "Binary   : left Expr, operator Token, right Expr",
  "Grouping : expression Expr",
  "Literal  : value Object",
  "Unary    : operator Token, right Expr",
]);
