import { Expr, ExprVariable } from './Expr';
import { Token } from "./Token";
import type { TypeOrNull } from './types';

export abstract class Stmt {
  abstract accept<R>(visitor: Visitor<R>): R;
}

export interface Visitor<R> {
  visitBlockStmt(stmt: StmtBlock): R;
  visitClassStmt(stmt: StmtClass): R;
  visitExpressionStmt(stmt: StmtExpression): R;
  visitFunctionStmt(stmt: StmtFunction): R;
  visitIfStmt(stmt: StmtIf): R;
  visitPrintStmt(stmt: StmtPrint): R;
  visitReturnStmt(stmt: StmtReturn): R;
  visitVarStmt(stmt: StmtVar): R;
  visitWhileStmt(stmt: StmtWhile): R;
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

export class StmtClass extends Stmt {
  name: Token;
  superclass: TypeOrNull<ExprVariable>;
  methods: Array<StmtFunction>;

  constructor(name: Token, superclass: TypeOrNull<ExprVariable>, methods: Array<StmtFunction>) {
    super();
    this.name = name;
    this.superclass = superclass;
    this.methods = methods;
  }

  public override accept<R>(visitor: Visitor<R>) {
    return visitor.visitClassStmt(this)
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

export class StmtFunction extends Stmt {
  name: Token;
  params: Array<Token>;
  body: Array<Stmt>;

  constructor(name: Token, params: Array<Token>, body: Array<Stmt>) {
    super();
    this.name = name;
    this.params = params;
    this.body = body;
  }

  public override accept<R>(visitor: Visitor<R>) {
    return visitor.visitFunctionStmt(this)
  }
}

export class StmtIf extends Stmt {
  condition: Expr;
  thenBranch: Stmt;
  elseBranch: TypeOrNull<Stmt>;

  constructor(condition: Expr, thenBranch: Stmt, elseBranch: TypeOrNull<Stmt>) {
    super();
    this.condition = condition;
    this.thenBranch = thenBranch;
    this.elseBranch = elseBranch;
  }

  public override accept<R>(visitor: Visitor<R>) {
    return visitor.visitIfStmt(this)
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

export class StmtReturn extends Stmt {
  keyword: Token;
  value: TypeOrNull<Expr>;

  constructor(keyword: Token, value: TypeOrNull<Expr>) {
    super();
    this.keyword = keyword;
    this.value = value;
  }

  public override accept<R>(visitor: Visitor<R>) {
    return visitor.visitReturnStmt(this)
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

export class StmtWhile extends Stmt {
  condition: Expr;
  body: Stmt;

  constructor(condition: Expr, body: Stmt) {
    super();
    this.condition = condition;
    this.body = body;
  }

  public override accept<R>(visitor: Visitor<R>) {
    return visitor.visitWhileStmt(this)
  }
}
