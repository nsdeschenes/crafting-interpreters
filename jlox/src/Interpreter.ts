import { Environment } from "./Environment";
import {
  Expr,
  ExprAssign,
  ExprBinary,
  ExprGrouping,
  ExprLiteral,
  ExprUnary,
  ExprVariable,
  type Visitor,
} from "./Expr";
import { Lox } from "./Lox";
import { RuntimeError } from "./RuntimeError";
import type {
  StmtExpression,
  StmtPrint,
  Stmt,
  StmtVar,
  StmtBlock,
} from "./Stmt";
import type { Token } from "./Token";
import { TokenType } from "./TokenType";
import type { TypeOrNull } from "./types";

export class Interpreter implements Visitor<TypeOrNull<Object>>, Visitor<void> {
  private environment: Environment = new Environment();

  public interpret(statements: Array<Stmt>): void {
    try {
      for (const statement of statements) {
        this.execute(statement);
      }
    } catch (error) {
      if (error instanceof RuntimeError) {
        Lox.runtimeError(error);
      }
    }
  }

  public visitLiteralExpr(expr: ExprLiteral): TypeOrNull<Object> {
    return expr.value;
  }

  public visitGroupingExpr(expr: ExprGrouping): TypeOrNull<Object> {
    return this.evaluate(expr.expression);
  }

  public visitUnaryExpr(expr: ExprUnary): TypeOrNull<Object> {
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.BANG:
        return !this.isTruthy(right);
      case TokenType.MINUS:
        this.checkNumberOperand(expr.operator, right);
        return -Number(right);
    }

    return null;
  }

  public visitVariableExpr(expr: ExprVariable): TypeOrNull<Object> {
    return this.environment.get(expr.name);
  }

  private checkNumberOperand(
    operator: Token,
    operand: TypeOrNull<Object>
  ): void {
    if (typeof operand === "number") return;
    throw new RuntimeError(operator, "Operand must be a number.");
  }

  private checkNumberOperands(
    operator: Token,
    left: TypeOrNull<Object>,
    right: TypeOrNull<Object>
  ): void {
    if (typeof left === "number" && typeof right === "number") return;
    throw new RuntimeError(operator, "Operands must be numbers.");
  }

  private isTruthy(object: TypeOrNull<Object>): boolean {
    if (object === null) return false;
    if (typeof object === "boolean") return Boolean(object);
    return true;
  }

  private isEqual(a: TypeOrNull<Object>, b: TypeOrNull<Object>): boolean {
    if (a === null && b === null) return true;
    if (a === null) return false;

    return a === b;
  }

  private stringify(object: TypeOrNull<Object>): string {
    if (object == null) return "nil";

    if (typeof object === "number") {
      let text = object.toString();
      if (text.endsWith(".0")) {
        text = text.substring(0, text.length - 2);
      }
      return text;
    }

    return object.toString();
  }

  public visitBinaryExpr(expr: ExprBinary): TypeOrNull<Object> {
    const left = this.evaluate(expr.left);
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.BANG_EQUAL:
        return !this.isEqual(left, right);
      case TokenType.EQUAL_EQUAL:
        return this.isEqual(left, right);
      case TokenType.GREATER:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) > Number(right);
      case TokenType.GREATER_EQUAL:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) >= Number(right);
      case TokenType.LESS:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) < Number(right);
      case TokenType.LESS_EQUAL:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) <= Number(right);
      case TokenType.MINUS:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) - Number(right);
      case TokenType.PLUS:
        if (typeof left === "number" && typeof right === "number") {
          return Number(left) + Number(right);
        }

        if (typeof left === "string" && typeof right === "string") {
          return String(left) + String(right);
        }

        throw new RuntimeError(
          expr.operator,
          "Operands must be two numbers or two strings."
        );
      case TokenType.SLASH:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) / Number(right);
      case TokenType.STAR:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) * Number(right);
    }

    return null;
  }

  private evaluate(expr: Expr): TypeOrNull<Object> {
    return expr.accept(this);
  }

  private execute(stmt: Stmt): void {
    stmt.accept(this);
  }

  public executeBlock(statements: Array<Stmt>, environment: Environment) {
    const previous = this.environment;
    try {
      this.environment = environment;
      for (const statement of statements) {
        this.execute(statement);
      }
    } finally {
      this.environment = environment;
    }
  }

  public visitBlockStmt(stmt: StmtBlock): void {
    this.executeBlock(stmt.statements, new Environment(this.environment));
    return;
  }

  public visitExpressionStmt(stmt: StmtExpression): void {
    this.evaluate(stmt.expression);
    return;
  }

  public visitPrintStmt(stmt: StmtPrint): void {
    const value = this.evaluate(stmt.expression);
    console.log(this.stringify(value));
    return;
  }

  public visitVarStmt(stmt: StmtVar): void {
    let value: TypeOrNull<Object> = null;
    if (stmt.initializer !== null) {
      value = this.evaluate(stmt.initializer);
    }

    this.environment.define(stmt.name.lexeme, value);
    return;
  }

  public visitAssignExpr(expr: ExprAssign): TypeOrNull<Object> {
    const value = this.evaluate(expr.value);
    this.environment.assign(expr.name, value);

    return value;
  }
}
