import type { Statement } from "typescript";
import {
  Expr,
  ExprAssign,
  ExprBinary,
  ExprCall,
  ExprGet,
  ExprGrouping,
  ExprLiteral,
  ExprLogical,
  ExprSet,
  ExprSuper,
  ExprThis,
  ExprUnary,
  ExprVariable,
  type Visitor as ExprVisitor,
} from "./Expr";
import { type Interpreter } from "./Interpreter";
import {
  Stmt,
  StmtClass,
  StmtExpression,
  StmtFunction,
  StmtIf,
  StmtPrint,
  StmtReturn,
  StmtVar,
  StmtWhile,
  type StmtBlock,
  type Visitor as StmtVisitor,
} from "./Stmt";
import type { Token } from "./Token";
import { Lox } from "./Lox";

function isStmt(value: any): value is Stmt {
  return value instanceof Stmt;
}

function isStmtArr(value: any): value is Array<Stmt> {
  return Array.isArray(value) && value.every((x) => x instanceof Stmt);
}

function isExpr(value: any): value is Expr {
  return value instanceof Expr;
}

export class Resolver implements ExprVisitor<void>, StmtVisitor<void> {
  private interpreter: Interpreter;
  private scopes = new Array<Map<string, boolean>>();
  private currentFunction: TFunctionType = FunctionType.NONE;
  private currentClass: TClassType = ClassType.NONE;

  constructor(interpreter: Interpreter) {
    this.interpreter = interpreter;
  }

  public visitBlockStmt(stmt: StmtBlock): void {
    this.beginScope();
    this.resolve(stmt.statements);
    this.endScope();
    return;
  }

  public visitClassStmt(stmt: StmtClass): void {
    const enclosingClass = this.currentClass;
    this.currentClass = ClassType.CLASS;

    this.declare(stmt.name);
    this.define(stmt.name);

    if (
      stmt.superclass !== null &&
      stmt.name.lexeme === stmt.superclass.name.lexeme
    ) {
      Lox.error(stmt.superclass.name, "A class can't inherit from itself.");
    }

    if (stmt.superclass !== null) {
      this.currentClass = ClassType.SUBCLASS;
      this.resolve(stmt.superclass);

      this.beginScope();
      this.scopes.at(-1)?.set("super", true);
    }

    this.beginScope();
    this.scopes.at(-1)?.set("this", true);

    for (const method of stmt.methods) {
      let declaration: TFunctionType = FunctionType.METHOD;

      if (method.name.lexeme === "init") {
        declaration = FunctionType.INITIALIZER;
      }

      this.resolveFunction(method, declaration);
    }

    this.endScope();

    if (stmt.superclass !== null) this.endScope();

    this.currentClass = enclosingClass;
    return;
  }

  public visitExpressionStmt(stmt: StmtExpression): void {
    this.resolve(stmt.expression);
    return;
  }

  public visitIfStmt(stmt: StmtIf): void {
    this.resolve(stmt.condition);
    this.resolve(stmt.thenBranch);
    if (stmt.elseBranch !== null) this.resolve(stmt.elseBranch);
    return;
  }

  public visitPrintStmt(stmt: StmtPrint): void {
    this.resolve(stmt.expression);
    return;
  }

  public visitReturnStmt(stmt: StmtReturn): void {
    if (this.currentFunction === FunctionType.NONE) {
      Lox.error(stmt.keyword, "Can't return from top-level code.");
    }

    if (stmt.value === null) {
      return;
    }

    if (this.currentFunction === FunctionType.INITIALIZER) {
      Lox.error(stmt.keyword, "Can't return a value from an initializer.");
    }

    this.resolve(stmt.value);
  }

  public visitFunctionStmt(stmt: StmtFunction): void {
    this.declare(stmt.name);
    this.define(stmt.name);
    this.resolveFunction(stmt, FunctionType.FUNCTION);
  }

  public visitVarStmt(stmt: StmtVar): void {
    this.declare(stmt.name);
    if (stmt.initializer !== null) {
      this.resolve(stmt.initializer);
    }
    this.define(stmt.name);
    return;
  }

  public visitWhileStmt(stmt: StmtWhile): void {
    this.resolve(stmt.condition);
    this.resolve(stmt.body);
    return;
  }

  public visitAssignExpr(expr: ExprAssign): void {
    this.resolve(expr.value);
    this.resolveLocal(expr, expr.name);
    return;
  }

  public visitBinaryExpr(expr: ExprBinary): void {
    this.resolve(expr.left);
    this.resolve(expr.right);
    return;
  }

  public visitCallExpr(expr: ExprCall): void {
    this.resolve(expr.callee);

    for (const arg of expr.args) {
      this.resolve(arg);
    }

    return;
  }

  public visitGetExpr(expr: ExprGet): void {
    this.resolve(expr.object);
    return;
  }

  public visitGroupingExpr(expr: ExprGrouping): void {
    this.resolve(expr.expression);
    return;
  }

  public visitLiteralExpr(expr: ExprLiteral): void {
    return;
  }

  public visitLogicalExpr(expr: ExprLogical): void {
    this.resolve(expr.left);
    this.resolve(expr.right);
    return;
  }

  public visitSetExpr(expr: ExprSet): void {
    this.resolve(expr.value);
    this.resolve(expr.object);
    return;
  }

  public visitSuperExpr(expr: ExprSuper): void {
    if (this.currentClass === ClassType.NONE) {
      Lox.error(expr.keyword, "Can't use 'super' outside of a class.");
    } else if (this.currentClass !== ClassType.SUBCLASS) {
      Lox.error(
        expr.keyword,
        "Can't use 'super' in a class with no superclass."
      );
    }

    this.resolveLocal(expr, expr.keyword);
    return;
  }

  public visitThisExpr(expr: ExprThis): void {
    if (this.currentClass === ClassType.NONE) {
      Lox.error(expr.keyword, "Can't use 'this' outside of a class.");
      return;
    }

    this.resolveLocal(expr, expr.keyword);
    return;
  }

  public visitUnaryExpr(expr: ExprUnary): void {
    this.resolve(expr.right);
    return;
  }

  public visitVariableExpr(expr: ExprVariable): void {
    if (
      !(this.scopes.length === 0) &&
      this.scopes.at(-1)?.get(expr.name.lexeme) === false
    ) {
      Lox.error(expr.name, "Can't read local variable in its own initializer.");
    }

    this.resolveLocal(expr, expr.name);
    return;
  }

  public resolve(value: Array<Stmt> | Stmt | Expr): void {
    if (isStmtArr(value)) {
      for (const stmt of value) {
        this.resolve(stmt);
      }
    }

    if (isStmt(value)) {
      value.accept(this);
    }

    if (isExpr(value)) {
      value.accept(this);
    }
    return;
  }

  private resolveFunction(func: StmtFunction, type: TFunctionType) {
    const enclosingFunction = this.currentFunction;
    this.currentFunction = type;

    this.beginScope();
    for (const param of func.params) {
      this.declare(param);
      this.define(param);
    }
    this.resolve(func.body);
    this.endScope();
    this.currentFunction = enclosingFunction;
  }

  private beginScope(): void {
    this.scopes.push(new Map<string, boolean>());
  }

  private endScope(): void {
    this.scopes.pop();
  }

  private declare(name: Token): void {
    if (this.scopes.length === 0) return;

    const scope = this.scopes.at(-1);
    if (scope?.has(name.lexeme)) {
      Lox.error(name, "Already a variable with this name in scope.");
    }

    scope?.set(name.lexeme, false);
  }

  private define(name: Token): void {
    if (this.scopes.length === 0) return;
    this.scopes.at(-1)?.set(name.lexeme, true);
  }

  private resolveLocal(expr: Expr, name: Token): void {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (this.scopes?.at(i)?.has(name.lexeme)) {
        this.interpreter.resolve(expr, this.scopes.length - 1 - i);
        return;
      }
    }
  }
}

const FunctionType = {
  NONE: "NONE",
  FUNCTION: "FUNCTION",
  INITIALIZER: "INITIALIZER",
  METHOD: "METHOD",
} as const;
type TFunctionType = keyof typeof FunctionType;

const ClassType = {
  NONE: "NONE",
  CLASS: "CLASS",
  SUBCLASS: "SUBCLASS",
} as const;
type TClassType = keyof typeof ClassType;
