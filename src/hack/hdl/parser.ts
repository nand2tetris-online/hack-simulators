import { HDLTokenizer, Token, TokenType } from "./tokenizer";

export class HDLParser {
  private input: HDLTokenizer

  token: Token = { literal: null, type: null }
  peek: Token = { literal: null, type: null }

  constructor(input: HDLTokenizer) {
    this.input = input
    this.advance()
    this.advance()
  }

  advance () {
    this.token = {...this.peek}
    this.input.advance()
    this.peek = {...this.input.token}
  }

  hasMoreTokens (): boolean {
    return !this.tokenIs(TokenType.EOF)
  }

  tokenIs (type: TokenType): boolean {
    return this.token.type === type
  }

  peekTokenIs (type: TokenType): boolean {
    return this.peek.type === type
  }

  expectCurrent (type: TokenType, failMessage: string) {
    if (!this.tokenIs(type)) {
      this.fail(failMessage)
    }
  }

  expectPeek (type: TokenType, failMessage: string): void | never {
    if (this.peekTokenIs(type)) {
      this.advance()
    } else {
      this.fail(failMessage)
    }
  }

  expectPeekOneOf (types: TokenType[], failMessage: string): void | never {
    if (this.peek.type && types.includes(this.peek.type)) {
      this.advance()
    } else {
      this.fail(failMessage)
    }
  }

  fail (message: string): never {
    this.input.fail(message)
  }

  static fail (message: string): never {
    HDLTokenizer.fail(message)
  }
}
