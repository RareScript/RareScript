var fs = require("fs");
var code = fs.readFileSync(process.argv[2]).toString("utf-8");

code = code.split("\r\n").join("\n");

var tokens = [];
var currentToken = "";
var isString = false;

var TokenType = {
  "SEPARATOR": 0,
  "IDENTIFIER": 1,
  "KEYWORD": 2,
  "OPERATOR": 3,
  "CHAR": 4,
  "STRING": 5,
  "NUMBER": 6
};
var tokenSeparators = [" ", "\n", ";", "(", ")", ","];
var digits = "0123456789";
var operators = ["(", ")", ",", "+", "-", "*", "/", "=", "!=", ":=", "..", "->"];

function addToken(index) {
  var type = TokenType.IDENTIFIER;
  if (currentToken == "\n" || currentToken == ";") {
    type = TokenType.SEPARATOR;
  }
  if (currentToken == "import") {
    type = TokenType.KEYWORD;
  }
  if (currentToken.startsWith("'") && currentToken.endsWith("'")) {
    type = TokenType.CHAR;
  }
  if (currentToken.startsWith("\"") && currentToken.endsWith("\"")) {
    type = TokenType.STRING;
  }
  if (digits.includes(currentToken[0])) {
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

for (var i = 0; i < code.length; i++) {
  var char = code[i];
  if (char == "\"") {
    isString = !isString;
  }
  if (isString) {
    currentToken += char;
    continue;
  }
  if (tokenSeparators.includes(char) || (digits.includes(currentToken.at(-1)) && !digits.includes(char)) || (!digits.includes(currentToken.at(-1)) && digits.includes(char))) {
    if (currentToken.length) {
      addToken(i);
    }
    currentToken = "";
    if (char != " ") {
      currentToken += char;
      if (char == "\n" || char == ";" || char == "(" || char == ")") {
        addToken(i + 1);
        currentToken = "";
      }
    }
    continue;
  }
  currentToken += char;
  if (char == "\"") {
    addToken(i + 1);
    currentToken = "";
  }
}
if (currentToken.length) {
  addToken(code.length);
}

for (var token of tokens) {
  var type = "[]";
  if (token.type == TokenType.SEPARATOR) {
    type = "[SEPARATOR]";
  }
  if (token.type == TokenType.IDENTIFIER) {
    type = "[IDENTIFIER]";
  }
  if (token.type == TokenType.KEYWORD) {
    type = "[KEYWORD]";
  }
  if (token.type == TokenType.OPERATOR) {
    type = "[OPERATOR]";
  }
  if (token.type == TokenType.CHAR) {
    type = "[CHAR]";
  }
  if (token.type == TokenType.STRING) {
    type = "[STRING]";
  }
  if (token.type == TokenType.NUMBER) {
    type = "[NUMBER]";
  }
  console.log(`\x1b[32m${type}\x1b[0m`, JSON.stringify(code.slice(token.start, token.start + token.length)).slice(1, -1));
}