import * as Sentry from "@sentry/bun";

import { Environment } from "./Environment";
import {
  Expr,
  ExprAssign,
  ExprBinary,
  ExprCall,
  ExprGrouping,
  ExprLiteral,
  ExprLogical,
  ExprUnary,
  ExprVariable,
  type Visitor,
} from "./Expr";
import { Lox } from "./Lox";
import { isLoxCallable, type LoxCallable } from "./LoxCallable";
import { LoxFunction } from "./LoxFunction";
import { Return } from "./Return";
import { RuntimeError } from "./RuntimeError";
import type {
  StmtExpression,
  StmtPrint,
  Stmt,
  StmtVar,
  StmtBlock,
  StmtIf,
  StmtWhile,
  StmtFunction,
  StmtReturn,
} from "./Stmt";
import type { Token } from "./Token";
import { TokenType } from "./TokenType";
import type { TypeOrNull } from "./types";

export class Interpreter implements Visitor<TypeOrNull<Object>>, Visitor<void> {
  public globals: Environment = new Environment();
  private environment: Environment = this.globals;

  constructor() {
    this.globals.define("clock", {
      arity(): number {
        return 0;
      },
      call(interpreter: Interpreter, args: Array<TypeOrNull<Object>>) {
        return Date.now() / 1000;
      },
      toString(): string {
        return "<native fn>";
      },
    } satisfies LoxCallable);
  }

  public interpret(statements: Array<Stmt>): void {
    return Sentry.startSpan({ name: "Interpreter.interpret" }, () => {
      try {
        for (const statement of statements) {
          this.execute(statement);
        }
      } catch (error) {
        if (error instanceof RuntimeError) {
          Lox.runtimeError(error);
        }
      }
    });
  }

  public visitLiteralExpr(expr: ExprLiteral): TypeOrNull<Object> {
    return Sentry.startSpan({ name: "Interpreter.visitLiteralExpr" }, () => {
      return expr.value;
    });
  }

  public visitLogicalExpr(expr: ExprLogical): TypeOrNull<Object> {
    return Sentry.startSpan({ name: "Interpreter.visitLogicalExpr" }, () => {
      const left = this.evaluate(expr.left);

      if (expr.operator.type === TokenType.OR) {
        if (this.isTruthy(left)) return left;
      } else {
        if (!this.isTruthy(left)) return left;
      }

      return this.evaluate(expr.right);
    });
  }

  public visitGroupingExpr(expr: ExprGrouping): TypeOrNull<Object> {
    return Sentry.startSpan({ name: "Interpreter.visitGroupingExpr" }, () => {
      return this.evaluate(expr.expression);
    });
  }

  public visitUnaryExpr(expr: ExprUnary): TypeOrNull<Object> {
    return Sentry.startSpan({ name: "Interpreter.visitUnaryExpr" }, () => {
      const right = this.evaluate(expr.right);

      switch (expr.operator.type) {
        case TokenType.BANG:
          return !this.isTruthy(right);
        case TokenType.MINUS:
          this.checkNumberOperand(expr.operator, right);
          return -Number(right);
      }

      return null;
    });
  }

  public visitVariableExpr(expr: ExprVariable): TypeOrNull<Object> {
    return Sentry.startSpan({ name: "Interpreter.visitVarableExpr" }, () => {
      return this.environment.get(expr.name);
    });
  }

  private checkNumberOperand(
    operator: Token,
    operand: TypeOrNull<Object>
  ): void {
    return Sentry.startSpan({ name: "Interpreter.checkNumberOperand" }, () => {
      if (typeof operand === "number") return;
      throw new RuntimeError(operator, "Operand must be a number.");
    });
  }

  private checkNumberOperands(
    operator: Token,
    left: TypeOrNull<Object>,
    right: TypeOrNull<Object>
  ): void {
    return Sentry.startSpan({ name: "Interpreter.checkNumberOperands" }, () => {
      if (typeof left === "number" && typeof right === "number") return;
      throw new RuntimeError(operator, "Operands must be numbers.");
    });
  }

  private isTruthy(object: TypeOrNull<Object>): boolean {
    return Sentry.startSpan({ name: "Interpreter.isTruthy" }, () => {
      if (object === null) return false;
      if (typeof object === "boolean") return Boolean(object);
      return true;
    });
  }

  private isEqual(a: TypeOrNull<Object>, b: TypeOrNull<Object>): boolean {
    return Sentry.startSpan({ name: "Interpreter.isEqual" }, () => {
      if (a === null && b === null) return true;
      if (a === null) return false;

      return a === b;
    });
  }

  private stringify(object: TypeOrNull<Object>): string {
    return Sentry.startSpan({ name: "Interpreter.stringify" }, () => {
      if (object == null) return "nil";

      if (typeof object === "number") {
        let text = object.toString();
        if (text.endsWith(".0")) {
          text = text.substring(0, text.length - 2);
        }
        return text;
      }

      return object.toString();
    });
  }

  public visitBinaryExpr(expr: ExprBinary): TypeOrNull<Object> {
    return Sentry.startSpan({ name: "Interpreter.visitBinaryExpr" }, () => {
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
    });
  }

  public visitCallExpr(expr: ExprCall): TypeOrNull<Object> {
    return Sentry.startSpan({ name: "Interpreter.visitCallExpr" }, () => {
      const callee = this.evaluate(expr.callee);
      const args: Array<TypeOrNull<Object>> = [];
      for (const arg of expr.args) {
        args.push(this.evaluate(arg));
      }

      if (!isLoxCallable(callee)) {
        throw new RuntimeError(
          expr.paren,
          "Can only call function and classes."
        );
      }

      const func = callee;
      if (args.length !== func.arity()) {
        throw new RuntimeError(
          expr.paren,
          `Expected ${func.arity()} arguments but got ${args.length}.`
        );
      }

      return func.call(this, args);
    });
  }

  private evaluate(expr: Expr): TypeOrNull<Object> {
    return Sentry.startSpan({ name: "Interpreter.evaluate" }, () => {
      return expr.accept(this);
    });
  }

  private execute(stmt: Stmt): void {
    return Sentry.startSpan({ name: "Interpreter.execute" }, () => {
      stmt.accept(this);
    });
  }

  public executeBlock(statements: Array<Stmt>, environment: Environment) {
    return Sentry.startSpan({ name: "Interpreter.executeBlock" }, () => {
      const previous = this.environment;
      try {
        this.environment = environment;
        for (const statement of statements) {
          this.execute(statement);
        }
      } finally {
        this.environment = environment;
      }
    });
  }

  public visitBlockStmt(stmt: StmtBlock): void {
    return Sentry.startSpan({ name: "Interpreter.visitBlockStmt" }, () => {
      this.executeBlock(stmt.statements, new Environment(this.environment));
      return;
    });
  }

  public visitExpressionStmt(stmt: StmtExpression): void {
    return Sentry.startSpan({ name: "Interpreter.visitExpressionStmt" }, () => {
      this.evaluate(stmt.expression);
      return;
    });
  }

  public visitFunctionStmt(stmt: StmtFunction): void {
    return Sentry.startSpan({ name: "Interpreter.visitFunctionStmt" }, () => {
      const func = new LoxFunction(stmt, this.environment);
      this.environment.define(stmt.name.lexeme, func);
      return;
    });
  }

  public visitIfStmt(stmt: StmtIf): void {
    return Sentry.startSpan({ name: "Interpreter.visitIfStmt" }, () => {
      if (this.isTruthy(this.evaluate(stmt.condition))) {
        this.execute(stmt.thenBranch);
      } else if (stmt.elseBranch !== null) {
        this.execute(stmt.elseBranch);
      }
      return;
    });
  }

  public visitPrintStmt(stmt: StmtPrint): void {
    return Sentry.startSpan({ name: "Interpreter.visitPrintStmt" }, () => {
      const value = this.evaluate(stmt.expression);
      console.log(this.stringify(value));
      return;
    });
  }

  public visitReturnStmt(stmt: StmtReturn) {
    return Sentry.startSpan({ name: "Interpreter.visitReturnStmt" }, () => {
      let value: TypeOrNull<Object> = null;
      if (stmt.value !== null) value = this.evaluate(stmt.value);

      throw new Return(value);
    });
  }

  public visitVarStmt(stmt: StmtVar): void {
    return Sentry.startSpan({ name: "Interpreter.visitVarStmt" }, () => {
      let value: TypeOrNull<Object> = null;
      if (stmt.initializer !== null) {
        value = this.evaluate(stmt.initializer);
      }

      this.environment.define(stmt.name.lexeme, value);
      return;
    });
  }

  public visitWhileStmt(stmt: StmtWhile): void {
    return Sentry.startSpan({ name: "Interpreter.visitWhileStmt" }, () => {
      while (this.isTruthy(this.evaluate(stmt.condition))) {
        this.execute(stmt.body);
      }
      return;
    });
  }

  public visitAssignExpr(expr: ExprAssign): TypeOrNull<Object> {
    return Sentry.startSpan({ name: "Interpreter.visitAssignExpr" }, () => {
      const value = this.evaluate(expr.value);
      this.environment.assign(expr.name, value);

      return value;
    });
  }
}
