var util = require("util");

var TokenType = {
  "SEPARATOR": 0,
  "IDENTIFIER": 1,
  "KEYWORD": 2,
  "OPERATOR": 3,
  "CHAR": 4,
  "STRING": 5,
  "NUMBER": 6
};

function getTokenValue(code, token) {
  if (!token) {
    return null;
  }
  return code.slice(token.start, token.start + token.length);
}

var InstructionType = {
  "IMPORT": 0,
  "EXPRESSION": 1,
  "VARIABLE": 2
};

var operatorPriority = [
  [".."],
  ["->", "->@"],
  ["**"],
  ["*", "/", "//", "%"],
  ["+", "-"],
  ["<<", ">>"],
  ["|", "&", "^"],
  ["<|"],
  ["=", "!=", "<", ">", "<=", ">="],
  ["or", "and"]
];

class RareScriptError {
  constructor(file, line, code, message) {
    this.file = file;
    this.line = line;
    this.code = code;
    this.message = message;
  }
};

function throwError(error, code) {
  console.log(`    \x1B[38;2;119;119;119m╭─\x1B[39m\x1B[35m[${error.file}]\x1B[39m\n    \x1B[38;2;119;119;119m·\x1B[39m\n${((error.line.toString().length > 3) ? "" : " ".repeat(3 - error.line.toString().length))}\x1B[31m${error.line}\x1B[39m${((error.line.toString().length > 3) ? "" : " ")}│ \x1B[33m\x1B[4m${code ? code.split("\n")[error.line - 1] : "[No source code]"}\x1B[24m\x1B[39m\n    \x1B[38;2;119;119;119m·\x1B[39m${" ".repeat((code ? code.split("\n")[error.line - 1].length : 16) - 1)}\x1B[33m╰─────── \x1B[1mE${error.code.toString(16).padStart(2, "0").toUpperCase()}: ${error.message}\x1B[22m\x1B[39m\n    \x1B[38;2;119;119;119m·\x1B[39m\n\x1B[38;2;119;119;119m────╯\x1B[39m`);
  return error;
}

function lexer(filename, code) {
  var tokens = [];
  var currentLine = 1;
  var currentToken = "";
  var isString = false;
  var tokenSeparators = [" ", "\n", ";", "(", ")", "{", "}", ","];
  var digits = "0123456789";
  var symbols = "!@#$%^&*-+\\|/=";
  var keywords = ["import", "as", "return", "cond", "false", "true", "maybe", "and", "or", "final"];
  var operators = ["(", ")", "{", "}", ",", "**", "+", "-", "*", "/", "//", "%", "=", "!=", ":=", "..", "->", "->@", "<", ">", "|", "&", "^", "<<", ">>", "<=", ">="];

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
      "length": currentToken.length,
      "line": currentLine
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
    if (tokenSeparators.includes(char) || (currentToken.at(-1) == "-" && digits.includes(char) && tokens.at(-1) && (tokens.at(-1).type == TokenType.NUMBER || tokens.at(-1).type == TokenType.IDENTIFIER || code.slice(tokens.at(-1).start, tokens.at(-1).start + tokens.at(-1).length) == ")")) || (currentToken.at(-1) != "-" && canBeIdentifier(currentToken.at(-1)) != canBeIdentifier(char) && !(isNumber(currentToken) && char == ".") && !(isNumber(currentToken) && currentToken.at(-1) == "." && digits.includes(char)) && !(currentToken == ":" && char == "=")) || (isNumber(currentToken) && currentToken.includes(".") && char == ".") || (currentToken.at(-1) == "-" && canBeIdentifier(char) && !digits.includes(char)) || (currentToken.length && !currentToken.split("").find(char2 => !symbols.includes(char2)) && char == "-") || (currentToken == "->" && char == "-")) {
      if (isNumber(currentToken) && currentToken.at(-1) == "." && char == ".") {
        currentToken = currentToken.slice(0, -1);
        addToken(i - 1);
        currentToken = "..";
        continue;
      }
      if (char == "\n") {
        currentLine--;
      }
      if (currentToken.length) {
        addToken(i);
      }
      if (char == "\n") {
        currentLine++;
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

function parser(filename, code, tokens) {
  tokens = Object.assign([], tokens);

  var ast = [];
  var cachedError = null;
  var lastToken = null;

  function takeToken() {
    lastToken = tokens.shift();
    return lastToken;
  }

  function expectToken(query) {
    if (!tokens.length) {
      return null;
    }
    if (typeof query === "number" && tokens[0].type == query) {
      return takeToken();
    }
    if (typeof query === "string" && getTokenValue(code, tokens[0]) == query) {
      return takeToken();
    }
    return null;
  }

  function requireSeparator() {
    if (!expectToken(TokenType.SEPARATOR)) {
      cachedError = new RareScriptError(filename, lastToken.line, 6, "Expected separator");
      return cachedError;
    }
  }

  while(tokens.length) {
    if (cachedError) {
      return cachedError;
    }
    var token = takeToken();
    var value = getTokenValue(code, token);
    if (token.type == TokenType.KEYWORD) {
      switch(value) {
        case "import":
          var module = expectToken(TokenType.IDENTIFIER);
          if (!module) {
            return new RareScriptError(filename, token.line, 4, "Expected module name");
          }
          var as = null;
          if (expectToken("as")) {
            as = expectToken(TokenType.IDENTIFIER);
            if (!as) {
              return new RareScriptError(filename, token.line, 5, "Expected import as name");
            }
          }
          requireSeparator();
          ast.push({
            "type": InstructionType.IMPORT,
            "module": getTokenValue(code, module),
            "as": getTokenValue(code, as)
          });
          continue;
        default:
          return new RareScriptError(filename, token.line, 3, `Unexpected keyword "${value}"`);
      }
    }
    if (token.type == TokenType.IDENTIFIER) {
      var type = null;
      var name = null;
      var modifiers = [];
      if (tokens[0].type == TokenType.IDENTIFIER && getTokenValue(code, tokens[1]) == ":=") {
        type = getTokenValue(code, token);
        name = getTokenValue(code, takeToken());
        takeToken(":=");
      } else if (getTokenValue(code, tokens[0]) == "final" && tokens[1].type == TokenType.IDENTIFIER && getTokenValue(code, tokens[2]) == ":=") {
        type = getTokenValue(code, token);
        modifiers.push(getTokenValue(code, takeToken()));
        name = getTokenValue(code, takeToken());
        takeToken(":=");
      }
      var value = [];
      if (type && name) {
        while(!expectToken(TokenType.SEPARATOR)) {
          var expressionToken = takeToken();
          if (!expressionToken) {
            return new RareScriptError(filename, token.line, 8, "Expected separator, got EOF");
          }
          value.push(expressionToken);
        }
        if (!value.length) {
          return new RareScriptError(filename, token.line, 9, "Expected variable value");
        }
        ast.push({
          "type": InstructionType.VARIABLE,
          "variableType": type,
          name, modifiers,
          "value": parseExpression(filename, code, value)
        });
        continue;
      }
    }
    if (token.type == TokenType.SEPARATOR) {
      continue;
    }
    var expression = [token];
    while(!expectToken(TokenType.SEPARATOR)) {
      var expressionToken = takeToken();
      if (!expressionToken) {
        return new RareScriptError(filename, token.line, 7, "Expected separator, got EOF");
      }
      expression.push(expressionToken);
    }
    ast.push({
      "type": InstructionType.EXPRESSION,
      "expression": parseExpression(filename, code, expression)
    });
  }

  if (cachedError) {
    return cachedError;
  }

  return ast;
}

function parseExpression(filename, code, tokens) {
  var expression = null;

  for (var tokenIndex = 0; tokenIndex < tokens.length; tokenIndex++) {
    if (getTokenValue(code, tokens[tokenIndex]) == "(") {
      var bracketDepth = 1;
      for (var tokenIndex2 = tokenIndex + 1; tokenIndex2 < tokens.length; tokenIndex2++) {
        if (getTokenValue(code, tokens[tokenIndex2]) == "(") {
          bracketDepth++;
        }
        if (getTokenValue(code, tokens[tokenIndex2]) == ")") {
          if (!--bracketDepth) {
            break;
          }
        }
      }
      tokens.splice(tokenIndex, tokenIndex2 - tokenIndex + 1, tokens.slice(tokenIndex + 1, tokenIndex2));
    }
  }

  for (var tokenIndex = 0; tokenIndex < tokens.length; tokenIndex++) {
    if (tokens[tokenIndex].type == TokenType.IDENTIFIER && tokens[tokenIndex + 1] && Array.isArray(tokens[tokenIndex + 1])) {
      var args = [[]];
      var bracketDepth = 0;
      for (var tokenIndex2 = 0; tokenIndex2 < tokens[tokenIndex + 1].length; tokenIndex2++) {
        var token2 = tokens[tokenIndex + 1][tokenIndex2];
        if (getTokenValue(code, token2) == "(") {
          bracketDepth++;
        }
        if (getTokenValue(code, token2) == ")") {
          bracketDepth--;
        }
        if (getTokenValue(code, token2) == "," && !bracketDepth) {
          args.push([]);
        } else {
          args.at(-1).push(token2);
        }
      }
      if (args.length == 1 && !args[0].length) {
        args = [];
      }
      tokens.splice(tokenIndex, 2, {
        "type": "function",
        "function": getTokenValue(code, tokens[tokenIndex]),
        "arguments": args.map(argument => parseExpression(filename, code, argument))
      });
    }
  }

  if (tokens.length == 1) {
    if (tokens[0].type == "function") {
      return tokens[0];
    } else if (tokens[0].type == TokenType.IDENTIFIER) {
      return {
        "type": "identifier",
        "value": getTokenValue(code, tokens[0])
      };
    } else if (tokens[0].type == TokenType.CHAR) {
      return {
        "type": "char",
        "value": getTokenValue(code, tokens[0])
      };
    } else if (tokens[0].type == TokenType.STRING) {
      return {
        "type": "string",
        "value": getTokenValue(code, tokens[0])
      };
    } else if (tokens[0].type == TokenType.NUMBER) {
      return {
        "type": "number",
        "value": getTokenValue(code, tokens[0])
      };
    }
  }

  for (var operatorsIndex = (operatorPriority.length - 1); operatorsIndex >= 0; operatorsIndex--) {
    var operators = operatorPriority[operatorsIndex];
    var foundIndex = tokens.findLastIndex(token => operators.includes(getTokenValue(code, token)));
    if (foundIndex > -1) {
      expression = {};
      expression.type = "operator";
      expression.operator = getTokenValue(code, tokens[foundIndex]);
      if (foundIndex == 1 && !Array.isArray(tokens[0])) {
        if (tokens[0].type == "function") {
          expression.left = tokens[0];
        } else if (tokens[0].type == TokenType.IDENTIFIER) {
          expression.left = {
            "type": "identifier",
            "value": getTokenValue(code, tokens[0])
          };
        } else if (tokens[0].type == TokenType.CHAR) {
          expression.left = {
            "type": "char",
            "value": getTokenValue(code, tokens[0])
          };
        } else if (tokens[0].type == TokenType.STRING) {
          expression.left = {
            "type": "string",
            "value": getTokenValue(code, tokens[0])
          };
        } else if (tokens[0].type == TokenType.NUMBER) {
          expression.left = {
            "type": "number",
            "value": getTokenValue(code, tokens[0])
          };
        }
      } else {
        expression.left = parseExpression(filename, code, tokens.slice(0, foundIndex).flat());
      }
      if (foundIndex == tokens.length - 2 && !Array.isArray(tokens.at(-1))) {
        if (tokens.at(-1).function) {
          expression.right = tokens.at(-1);
        } else if (tokens.at(-1).type == TokenType.IDENTIFIER) {
          expression.right = {
            "type": "identifier",
            "value": getTokenValue(code, tokens.at(-1))
          };
        } else if (tokens.at(-1).type == TokenType.CHAR) {
          expression.right = {
            "type": "char",
            "value": getTokenValue(code, tokens.at(-1))
          };
        } else if (tokens.at(-1).type == TokenType.STRING) {
          expression.right = {
            "type": "string",
            "value": getTokenValue(code, tokens.at(-1))
          };
        } else if (tokens.at(-1).type == TokenType.NUMBER) {
          expression.right = {
            "type": "number",
            "value": getTokenValue(code, tokens.at(-1))
          };
        }
      } else {
        expression.right = parseExpression(filename, code, tokens.slice(foundIndex + 1).flat());
      }
      break;
    }
  }

  return expression;
}

function processCode(filename, code, debug, supressErrors) {
  code = code.split("\r\n").join("\n");

  var tokens = lexer(filename, code);
  if (tokens instanceof RareScriptError) {
    if (supressErrors) {
      return tokens;
    }
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
      return `\x1b[${color}m${getTokenValue(code, token)}\x1b[0m`;
    }).join(" "));
    console.log(tokens);
  }

  var ast = parser(filename, code, tokens);
  if (ast instanceof RareScriptError) {
    if (supressErrors) {
      return ast;
    }
    return throwError(ast, code);
  }
  if (debug) {
    console.log(`\x1b[32m[DEBUG / ${ast.length} INSTRUCTIONS]\x1b[0m`);
    console.log(util.inspect(ast, false, null, true));
  }

  return { tokens, ast };
}

if (typeof module !== "undefined") {
  if (require.main == module) {
    var fs = require("fs");
    var path = require("path");
    var code = fs.readFileSync(process.argv[2]).toString("utf-8");
    processCode(path.basename(process.argv[2]), code, true);
  }
  module.exports = { TokenType, getTokenValue, InstructionType, RareScriptError, lexer, parser, parseExpression, processCode };
}