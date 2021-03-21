export enum TokenType {
  IDENTIFIER = 'IDENTIFIER',
  INT = 'INT',
  SEMICOLON = 'SEMICOLON',
  EOF = 'EOF',

  INVALID = 'INVALID',
}

export class ScriptError extends Error {}

export type Token = {
  type: TokenType | null
  literal: string | null
}

export class ScriptTokenizer {
  private input: string
  private readpos: number
  private pos: number
  private cur: string
  private keywords: { [_: string]: TokenType }

  // current token
  token: Token = { type: null, literal: null }

  constructor (input: string) {
    this.input = input
    this.readpos = 0
    this.pos = 0
    this.cur = ''
    this.keywords = {};

    this.readChar()
  }

  hasMoreTokens (): boolean {
    return this.token.type !== TokenType.EOF
  }

  advance () {
    this.skipWhitespaceAndComments()

    this.token.literal = this.cur
    switch (this.cur) {
      case ';':
        this.token.type = TokenType.SEMICOLON
        break
      case '':
        this.token.type = TokenType.EOF
        break
      default:
        if (isLetter(this.cur)) {
          const ident = this.readIdentifier()
          this.token.type = this.lookupIdentifier(ident)
          this.token.literal = ident
          return
        } else if (isDigit(this.cur)) {
          this.token.type = TokenType.INT
          this.token.literal = this.readNumber()
          return
        }
    }

    this.readChar()
  }

  fail (message: string): never {
    ScriptTokenizer.fail(message)
  }

  static fail (message: string): never {
    throw new ScriptError(message)
  }

  private lookupIdentifier (ident: string): TokenType {
    return this.keywords[ident] ?? TokenType.IDENTIFIER
  }

  private readIdentifier (): string {
    const pos = this.pos
    while (isLetter(this.cur) || isDigit(this.cur)) {
      this.readChar()
    }
    return this.input.substring(pos, this.pos)
  }

  private readNumber (): string {
    const pos = this.pos
    while (isDigit(this.cur)) {
      this.readChar()
    }
    return this.input.substring(pos, this.pos)
  }

  private readChar () {
    this.cur = this.readpos >= this.input.length ? '' : this.input[this.readpos]
    this.pos = this.readpos
    this.readpos++
  }

  private peekChar () {
    return this.readpos >= this.input.length ? '' : this.input[this.readpos]
  }

  private skipWhitespaceAndComments () {
    let inSlashComment = false
    let inStarComment = false

    while (true) {
      const peek = this.peekChar()

      // isSlashCommentStart
      if (this.cur === '/' && peek === '/') {
        inSlashComment = true
        this.readChar() // read peek as well
        // isSlashCommentEnd
      } else if (inSlashComment && this.cur === '\n') {
        inSlashComment = false
        // isStarCommentStart
      } else if (this.cur === '/' && peek === '*') {
        inStarComment = true
        this.readChar() // read peek as well
        // isStarCommentEnd
      } else if (inStarComment && (this.cur === '*' && peek === '/')) {
        inStarComment = false
        this.readChar() // read peek as well
      } else if (!inSlashComment && !inStarComment && !(this.cur === ' ' || this.cur === '\t' ||
                                                        this.cur === '\n' || this.cur === '\r')) {
        return
      }

      this.readChar()
    }
  }
}

function isLetter (char: string): boolean {
  const n = char.charCodeAt(0)
  return (n >= 65 && n < 91) || (n >= 97 && n < 123)
}

function isDigit (char: string): boolean {
  const n = char.charCodeAt(0)
  return (n >= 48 && n < 58)
}

