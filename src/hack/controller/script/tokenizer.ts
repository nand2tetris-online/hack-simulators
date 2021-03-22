export enum TokenType {
  IDENTIFIER = 'IDENTIFIER',
  INT = 'INT',
  EOF = 'EOF',

  REPEAT = 'REPEAT',
  OUTPUT_FILE = 'OUTPUT-FILE',
  COMPARE_TO = 'COMPARE-TO',
  OUTPUT_LIST = 'OUTPUT-LIST',
  OUTPUT = 'OUTPUT',

  SEMICOLON = 'SEMICOLON',
  COMMA = 'COMMA',
  LBRACE = '{',
  RBRACE = '}',

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

  lineNumber: number;


  constructor (input: string) {
    this.input = input
    this.readpos = 0
    this.pos = 0
    this.cur = ''
    this.keywords = {
      'repeat': TokenType.REPEAT,
      'output-file': TokenType.OUTPUT_FILE,
      'compare-to': TokenType.COMPARE_TO,
      'output-list': TokenType.OUTPUT_LIST,
      'output': TokenType.OUTPUT,
    };

    this.lineNumber = 0;
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
        break;
      case ',':
        this.token.type = TokenType.COMMA
        break;
      case '{':
        this.token.type = TokenType.LBRACE
        break
      case '}':
        this.token.type = TokenType.RBRACE
        break;
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
    while (isLetter(this.cur) || isDigit(this.cur) || this.cur === '-' || this.cur === '.') {
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

      if (this.cur === '\n') { this.lineNumber++; }

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
  return (n >= 65 && n < 91) || (n >= 97 && n < 123) || char === '%';
}

function isDigit (char: string): boolean {
  const n = char.charCodeAt(0)
  return (n >= 48 && n < 58)
}

