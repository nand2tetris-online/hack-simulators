import { HDLTokenizer, Token, TokenType } from "./HDLTokenizer";

export class HDLParser {
  private input: HDLTokenizer

  cur: Token = { literal: null, type: null }
  peek: Token = { literal: null, type: null }

  constructor(input: HDLTokenizer) {
    this.input = input
    this.advance()
    this.advance()
  }

  advance () {
    this.cur = {...this.peek}
    this.input.advance()
    this.peek = {...this.input.token}
  }

  tokenIs (type: TokenType): boolean {
    return this.cur.type === type
  }

  peekTokenIs (type: TokenType): boolean {
    return this.peek.type === type
  }

  expectCurrent (type: TokenType, failMessage: string) {
    if (!this.tokenIs(type)) {
      this.input.fail(failMessage)
    }
  }

  expectPeek (type: TokenType, failMessage: string): void | never {
    if (this.peekTokenIs(type)) {
      this.advance()
    } else {
      this.input.fail(failMessage)
    }
  }
}
