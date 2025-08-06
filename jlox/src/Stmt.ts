import { Expr } from './Expr';
import { Token } from "./Token";
import type { TypeOrNull } from './types';

export abstract class Stmt {
  abstract accept<R>(visitor: Visitor<R>): R;
}

export interface Visitor<R> {
  visitBlockStmt(stmt: StmtBlock): R;
  visitExpressionStmt(stmt: StmtExpression): R;
  visitPrintStmt(stmt: StmtPrint): R;
  visitVarStmt(stmt: StmtVar): R;
}

export class StmtBlock extends Stmt {
  statements: Array<Stmt>;

  constructor(statements: Array<Stmt>) {
    super();
    this.statements = statements;
  }

  public override accept<R>(visitor: Visitor<R>) {
    return visitor.visitBlockStmt(this)
  }
}

export class StmtExpression extends Stmt {
  expression: Expr;

  constructor(expression: Expr) {
    super();
    this.expression = expression;
  }

  public override accept<R>(visitor: Visitor<R>) {
    return visitor.visitExpressionStmt(this)
  }
}

export class StmtPrint extends Stmt {
  expression: Expr;

  constructor(expression: Expr) {
    super();
    this.expression = expression;
  }

  public override accept<R>(visitor: Visitor<R>) {
    return visitor.visitPrintStmt(this)
  }
}

export class StmtVar extends Stmt {
  name: Token;
  initializer: TypeOrNull<Expr>;

  constructor(name: Token, initializer: TypeOrNull<Expr>) {
    super();
    this.name = name;
    this.initializer = initializer;
  }

  public override accept<R>(visitor: Visitor<R>) {
    return visitor.visitVarStmt(this)
  }
}
