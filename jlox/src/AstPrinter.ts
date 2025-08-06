import {
  type Visitor,
  Expr,
  ExprAssign,
  ExprBinary,
  ExprGrouping,
  ExprLiteral,
  ExprUnary,
  ExprVariable,
} from "./Expr";
import { Token } from "./Token";
import { TokenType } from "./TokenType";

export class AstPrinter implements Visitor<string> {
  print(expr: Expr): string {
    return expr.accept(this);
  }

  visitBinaryExpr(expr: ExprBinary) {
    return this.parenthesize(expr.operator.lexeme, expr.left, expr.right);
  }

  visitGroupingExpr(expr: ExprGrouping) {
    return this.parenthesize("group", expr.expression);
  }

  visitLiteralExpr(expr: ExprLiteral) {
    if (expr.value === null) return "nil";
    return expr.value.toString();
  }

  visitUnaryExpr(expr: ExprUnary) {
    return this.parenthesize(expr.operator.lexeme, expr.right);
  }

  visitAssignExpr(expr: ExprAssign): string {
    return this.parenthesize("assign", expr);
  }

  visitVariableExpr(expr: ExprVariable): string {
    return this.parenthesize("variable", expr);
  }

  parenthesize(name: string, ...exprs: Array<Expr>) {
    const builder: Array<string> = [];

    builder.push(`(${name}`);
    for (const expr of exprs) {
      builder.push(" ");
      builder.push(expr.accept(this));
    }
    builder.push(")");
    return builder.join("");
  }
}

const expression = new ExprBinary(
  new ExprUnary(new Token(TokenType.MINUS, "-", null, 1), new ExprLiteral(123)),
  new Token(TokenType.STAR, "*", null, 1),
  new ExprGrouping(new ExprLiteral(45.67))
);
console.log(new AstPrinter().print(expression));
