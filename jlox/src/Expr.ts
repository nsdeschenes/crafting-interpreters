import { Token } from "./Token";
import type { TypeOrNull } from './types';

export abstract class Expr {
  abstract accept<R>(visitor: Visitor<R>): R;
}

export interface Visitor<R> {
  visitAssignExpr(expr: ExprAssign): R;
  visitBinaryExpr(expr: ExprBinary): R;
  visitGroupingExpr(expr: ExprGrouping): R;
  visitLiteralExpr(expr: ExprLiteral): R;
  visitLogicalExpr(expr: ExprLogical): R;
  visitUnaryExpr(expr: ExprUnary): R;
  visitVariableExpr(expr: ExprVariable): R;
}

export class ExprAssign extends Expr {
  name: Token;
  value: Expr;

  constructor(name: Token, value: Expr) {
    super();
    this.name = name;
    this.value = value;
  }

  public override accept<R>(visitor: Visitor<R>) {
    return visitor.visitAssignExpr(this)
  }
}

export class ExprBinary extends Expr {
  left: Expr;
  operator: Token;
  right: Expr;

  constructor(left: Expr, operator: Token, right: Expr) {
    super();
    this.left = left;
    this.operator = operator;
    this.right = right;
  }

  public override accept<R>(visitor: Visitor<R>) {
    return visitor.visitBinaryExpr(this)
  }
}

export class ExprGrouping extends Expr {
  expression: Expr;

  constructor(expression: Expr) {
    super();
    this.expression = expression;
  }

  public override accept<R>(visitor: Visitor<R>) {
    return visitor.visitGroupingExpr(this)
  }
}

export class ExprLiteral extends Expr {
  value: TypeOrNull<Object>;

  constructor(value: TypeOrNull<Object>) {
    super();
    this.value = value;
  }

  public override accept<R>(visitor: Visitor<R>) {
    return visitor.visitLiteralExpr(this)
  }
}

export class ExprLogical extends Expr {
  left: Expr;
  operator: Token;
  right: Expr;

  constructor(left: Expr, operator: Token, right: Expr) {
    super();
    this.left = left;
    this.operator = operator;
    this.right = right;
  }

  public override accept<R>(visitor: Visitor<R>) {
    return visitor.visitLogicalExpr(this)
  }
}

export class ExprUnary extends Expr {
  operator: Token;
  right: Expr;

  constructor(operator: Token, right: Expr) {
    super();
    this.operator = operator;
    this.right = right;
  }

  public override accept<R>(visitor: Visitor<R>) {
    return visitor.visitUnaryExpr(this)
  }
}

export class ExprVariable extends Expr {
  name: Token;

  constructor(name: Token) {
    super();
    this.name = name;
  }

  public override accept<R>(visitor: Visitor<R>) {
    return visitor.visitVariableExpr(this)
  }
}
