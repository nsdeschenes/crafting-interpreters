import { Environment } from "./Environment";
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
  ExprThis,
  ExprUnary,
  ExprVariable,
  type Visitor,
} from "./Expr";
import { Lox } from "./Lox";
import { isLoxCallable, type LoxCallable } from "./LoxCallable";
import { LoxClass } from "./LoxClass";
import { LoxFunction } from "./LoxFunction";
import { LoxInstance } from "./LoxInstance";
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
  StmtClass,
} from "./Stmt";
import type { Token } from "./Token";
import { TokenType } from "./TokenType";
import type { TypeOrNull } from "./types";

export class Interpreter implements Visitor<TypeOrNull<Object>>, Visitor<void> {
  public globals: Environment = new Environment();
  private environment: Environment = this.globals;
  private locals: Map<Expr, number> = new Map();

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

  public visitLogicalExpr(expr: ExprLogical): TypeOrNull<Object> {
    const left = this.evaluate(expr.left);

    if (expr.operator.type === TokenType.OR) {
      if (this.isTruthy(left)) return left;
    } else {
      if (!this.isTruthy(left)) return left;
    }

    return this.evaluate(expr.right);
  }

  public visitSetExpr(expr: ExprSet): TypeOrNull<Object> {
    const object = this.evaluate(expr.object);

    if (!(object instanceof LoxInstance)) {
      throw new RuntimeError(expr.name, "Only instances have fields.");
    }

    const value = this.evaluate(expr.value);
    object.set(expr.name, value);
    return value;
  }

  public visitThisExpr(expr: ExprThis): TypeOrNull<Object> {
    return this.lookUpVariable(expr.keyword, expr);
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
    return this.lookUpVariable(expr.name, expr);
  }

  private lookUpVariable(name: Token, expr: Expr): TypeOrNull<Object> {
    const distance = this.locals.get(expr);
    if (distance !== undefined) {
      return this.environment.getAt(distance, name.lexeme);
    } else {
      return this.globals.get(name);
    }
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

  public visitCallExpr(expr: ExprCall): TypeOrNull<Object> {
    const callee = this.evaluate(expr.callee);
    const args: Array<TypeOrNull<Object>> = new Array();
    for (const arg of expr.args) {
      args.push(this.evaluate(arg));
    }

    if (!isLoxCallable(callee)) {
      throw new RuntimeError(expr.paren, "Can only call function and classes.");
    }

    const func = callee;
    if (args.length !== func.arity()) {
      throw new RuntimeError(
        expr.paren,
        `Expected ${func.arity()} arguments but got ${args.length}.`
      );
    }

    return func.call(this, args);
  }

  public visitGetExpr(expr: ExprGet): TypeOrNull<Object> {
    const object = this.evaluate(expr.object);
    if (object instanceof LoxInstance) {
      return object.get(expr.name);
    }

    throw new RuntimeError(expr.name, "Only instances have properties.");
  }

  private evaluate(expr: Expr): TypeOrNull<Object> {
    return expr.accept(this);
  }

  private execute(stmt: Stmt): void {
    stmt.accept(this);
  }

  public resolve(expr: Expr, depth: number): void {
    this.locals.set(expr, depth);
  }

  public executeBlock(statements: Array<Stmt>, environment: Environment) {
    const previous = this.environment;
    try {
      this.environment = environment;
      for (const statement of statements) {
        this.execute(statement);
      }
    } finally {
      this.environment = previous;
    }
  }

  public visitBlockStmt(stmt: StmtBlock): void {
    this.executeBlock(stmt.statements, new Environment(this.environment));
    return;
  }

  public visitClassStmt(stmt: StmtClass): void {
    this.environment.define(stmt.name.lexeme, null);

    const methods = new Map<string, LoxFunction>();
    for (const method of stmt.methods) {
      const func = new LoxFunction(method, this.environment, true);
      methods.set(method.name.lexeme, func);
    }

    const klass = new LoxClass(stmt.name.lexeme, methods);
    this.environment.assign(stmt.name, klass);

    return;
  }

  public visitExpressionStmt(stmt: StmtExpression): void {
    this.evaluate(stmt.expression);
    return;
  }

  public visitFunctionStmt(stmt: StmtFunction): void {
    const func = new LoxFunction(stmt, this.environment, false);
    this.environment.define(stmt.name.lexeme, func);
    return;
  }

  public visitIfStmt(stmt: StmtIf): void {
    if (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.thenBranch);
    } else if (stmt.elseBranch !== null) {
      this.execute(stmt.elseBranch);
    }
    return;
  }

  public visitPrintStmt(stmt: StmtPrint): void {
    const value = this.evaluate(stmt.expression);
    console.log(this.stringify(value));
    return;
  }

  public visitReturnStmt(stmt: StmtReturn) {
    let value: TypeOrNull<Object> = null;
    if (stmt.value !== null) value = this.evaluate(stmt.value);

    throw new Return(value);
  }

  public visitVarStmt(stmt: StmtVar): void {
    let value: TypeOrNull<Object> = null;
    if (stmt.initializer !== null) {
      value = this.evaluate(stmt.initializer);
    }

    this.environment.define(stmt.name.lexeme, value);
    return;
  }

  public visitWhileStmt(stmt: StmtWhile): void {
    while (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.body);
    }
    return;
  }

  public visitAssignExpr(expr: ExprAssign): TypeOrNull<Object> {
    const value = this.evaluate(expr.value);

    const distance = this.locals.get(expr);
    if (distance && distance !== null) {
      this.environment.assignAt(distance, expr.name, value);
    } else {
      this.globals.assign(expr.name, value);
    }

    return value;
  }
}
