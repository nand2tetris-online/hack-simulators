export enum TokenType {
  IDENTIFIER = 'IDENTIFIER',

  TRUE = 'true',
  FALSE = 'false',
  CHIP = 'CHIP',
  IN = 'IN',
  OUT = 'OUT',
  PARTS = 'PARTS',
  BUILTIN = 'BUILTIN',

  INT = 'INT',
  LBRACE = 'LBRACE',
  RBRACE = 'RBRACE',
  LBRACKET = 'LBRACKET',
  RBRACKET = 'RBRACKET',
  LPAREN = 'LPAREN',
  RPAREN = 'RPAREN',
  COLON = 'COLON',
  EQUAL = 'EQUAL',
  COMMA = 'COMMA',
  SEMICOLON = 'SEMICOLON',
  DOT = 'DOT',
  INVALID = 'INVALID',

  EOF = 'EOF',
}

export class HDLError extends Error {}

export class HDLTokenizer {
  private input: string
  private readpos: number
  private pos: number
  private cur: string
  private keywords: { [_: string]: TokenType }

  // current token
  token: string | null
  tokenType: TokenType | null

  constructor (input: string) {
    this.input = input
    this.readpos = 0
    this.pos = 0
    this.cur = ''
    this.keywords = {
      CHIP: TokenType.CHIP,
      IN: TokenType.IN,
      OUT: TokenType.OUT,
      PARTS: TokenType.PARTS,
      BUILTIN: TokenType.BUILTIN,
      true: TokenType.TRUE,
      false: TokenType.FALSE
    }

    this.tokenType = null
    this.token = null

    this.readChar()
  }

  hasMoreTokens (): boolean {
    return this.tokenType !== TokenType.EOF
  }

  advance () {
    this.skipWhitespaceAndComments()

    this.token = this.cur
    switch (this.cur) {
      case '{':
        this.tokenType = TokenType.LBRACE
        break
      case '}':
        this.tokenType = TokenType.RBRACE
        break
      case '(':
        this.tokenType = TokenType.LPAREN
        break
      case ')':
        this.tokenType = TokenType.RPAREN
        break
      case '[':
        this.tokenType = TokenType.LBRACKET
        break
      case ']':
        this.tokenType = TokenType.RBRACKET
        break
      case '=':
        this.tokenType = TokenType.EQUAL
        break
      case ',':
        this.tokenType = TokenType.COMMA
        break
      case '.':
        this.tokenType = TokenType.DOT
        break
      case ':':
        this.tokenType = TokenType.COLON
        break
      case ';':
        this.tokenType = TokenType.SEMICOLON
        break
      case '':
        this.tokenType = TokenType.EOF
        break
      default:
        if (isLetter(this.cur)) {
          const ident = this.readIdentifier()
          this.tokenType = this.lookupIdentifier(ident)
          this.token = ident
          return
        } else if (isDigit(this.cur)) {
          this.tokenType = TokenType.INT
          this.token = this.readNumber()
          return
        }
    }

    this.readChar()
  }

  fail (message: string): never {
    throw new HDLError(message)
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
