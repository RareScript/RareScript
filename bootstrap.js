var TokenType = {
  "SEPARATOR": 0,
  "IDENTIFIER": 1,
  "KEYWORD": 2,
  "OPERATOR": 3,
  "CHAR": 4,
  "STRING": 5,
  "NUMBER": 6
};

class RareScriptError {
  constructor(file, line, code, message) {
    this.file = file;
    this.line = line;
    this.code = code;
    this.message = message;
  }
};

function lexer(filename, code) {
  var tokens = [];
  var currentLine = 1;
  var currentToken = "";
  var isString = false;
  var tokenSeparators = [" ", "\n", ";", "(", ")", "{", "}", ","];
  var digits = "0123456789";
  var symbols = "!@#$%^&*-+\\|/=";
  var keywords = ["import", "as", "return", "cond", "false", "true", "maybe", "and", "or"];
  var operators = ["(", ")", "{", "}", ",", "+", "-", "*", "/", "%", "=", "!=", ":=", "..", "->", "->@", "<", ">"];

  function addToken(index) {
    var type = TokenType.IDENTIFIER;
    if (currentToken == "\n" || currentToken == ";") {
      type = TokenType.SEPARATOR;
    }
    if (keywords.includes(currentToken)) {
      type = TokenType.KEYWORD;
    }
    if (currentToken.startsWith("'") && currentToken.endsWith("'")) {
      type = TokenType.CHAR;
    }
    if (currentToken.startsWith("\"") && currentToken.endsWith("\"")) {
      type = TokenType.STRING;
    }
    if (isNumber(currentToken)) {
      type = TokenType.NUMBER;
    }
    if (operators.includes(currentToken)) {
      type = TokenType.OPERATOR;
    }
    tokens.push({
      type,
      "start": index - currentToken.length,
      "length": currentToken.length
    });
  }

  function canBeIdentifier(data) {
    if (digits.includes(data)) {
      return !!currentToken.length;
    }
    if (`${symbols}(){}.,<>'"\``.includes(data)) {
      return false;
    }
    return true;
  }

  function isNumber(data) {
    return (digits.includes(data[0]) || (data[0] == "-" && digits.includes(data[1])));
  }

  for (var i = 0; i < code.length; i++) {
    var char = code[i];
    if (char == "\n") {
      if (isString) {
        return new RareScriptError(filename, currentLine, 0, "Got new line before string close");
      }
      currentLine++;
    }
    if (char == "'") {
      if (code[i + 2] != "'") {
        return new RareScriptError(filename, currentLine, 1, "Invalid char");
      }
      currentToken += char;
      currentToken += code[i + 1];
      currentToken += char;
      i += 2;
      addToken(i + 1);
      currentToken = "";
      continue;
    }
    if (char == "\"") {
      isString = !isString;
      if (!isString) {
        currentToken += char;
        addToken(i + 1);
        currentToken = "";
        continue;
      }
    }
    if (isString) {
      currentToken += char;
      continue;
    }
    if (currentToken == "%%") {
      currentToken = "";
      i += code.slice(i).indexOf("\n") - 1;
      continue;
    }
    if (tokenSeparators.includes(char) || (currentToken.at(-1) == "-" && digits.includes(char) && tokens.at(-1) && (tokens.at(-1).type == TokenType.NUMBER || tokens.at(-1).type == TokenType.IDENTIFIER || code.slice(tokens.at(-1).start, tokens.at(-1).start + tokens.at(-1).length) == ")")) || (currentToken.at(-1) != "-" && canBeIdentifier(currentToken.at(-1)) != canBeIdentifier(char) && !(isNumber(currentToken) && char == ".") && !(isNumber(currentToken) && currentToken.at(-1) == "." && digits.includes(char))) || (isNumber(currentToken) && currentToken.includes(".") && char == ".") || (currentToken.at(-1) == "-" && canBeIdentifier(char) && !digits.includes(char)) || (currentToken.length && !currentToken.split("").find(char2 => !symbols.includes(char2)) && char == "-") || (currentToken == "->" && char == "-")) {
      if (isNumber(currentToken) && currentToken.at(-1) == "." && char == ".") {
        currentToken = currentToken.slice(0, -1);
        addToken(i - 1);
        currentToken = "..";
        continue;
      }
      if (currentToken.length) {
        addToken(i);
      }
      currentToken = "";
      if (char != " " && char != "\n") {
        currentToken += char;
        if (char == ";" || char == "(" || char == ")" || char == ",") {
          addToken(i + 1);
          currentToken = "";
        }
      }
      continue;
    }
    currentToken += char;
  }
  if (currentToken.length) {
    addToken(code.length);
  }
  if (isString) {
    return new RareScriptError(filename, currentLine, 2, "Got EOF before string close");
  }

  return tokens;
}

function throwError(error, code) {
  console.log(`    \x1B[38;2;119;119;119m╭─\x1B[39m\x1B[35m[${error.file}]\x1B[39m\n    \x1B[38;2;119;119;119m·\x1B[39m\n${((error.line.toString().length > 3) ? "" : " ".repeat(3 - error.line.toString().length))}\x1B[31m${error.line}\x1B[39m${((error.line.toString().length > 3) ? "" : " ")}│ \x1B[33m\x1B[4m${code ? code.split("\n")[error.line - 1] : "[No source code]"}\x1B[24m\x1B[39m\n    \x1B[38;2;119;119;119m·\x1B[39m${" ".repeat((code ? code.split("\n")[error.line - 1].length : 16) - 1)}\x1B[33m╰─────── \x1B[1mE${error.code.toString(16).padStart(2, "0").toUpperCase()}: ${error.message}\x1B[22m\x1B[39m\n    \x1B[38;2;119;119;119m·\x1B[39m\n\x1B[38;2;119;119;119m────╯\x1B[39m`);
}

function processCode(filename, code, debug) {
  code = code.split("\r\n").join("\n");

  var tokens = lexer(filename, code);
  if (tokens instanceof RareScriptError) {
    return throwError(tokens, code);
  }
  if (debug) {
    console.log(`\x1b[32m[DEBUG / ${tokens.length} TOKENS]\x1b[0m`);
    console.log(tokens.map(token => {
      var color = 37;
      if (token.type == TokenType.SEPARATOR) {
        color = 31;
      }
      if (token.type == TokenType.IDENTIFIER) {
        color = 36;
      }
      if (token.type == TokenType.KEYWORD) {
        color = 35;
      }
      if (token.type == TokenType.CHAR) {
        color = 34;
      }
      if (token.type == TokenType.STRING) {
        color = 32;
      }
      if (token.type == TokenType.NUMBER) {
        color = 33;
      }
      return `\x1b[${color}m${code.slice(token.start, token.start + token.length)}\x1b[0m`;
    }).join(" "));
  }
}

var fs = require("fs");
var path = require("path");
var code = fs.readFileSync(process.argv[2]).toString("utf-8");
processCode(path.basename(process.argv[2]), code, true);