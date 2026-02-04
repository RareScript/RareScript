var RareScript = require("./bootstrap.js");

var testNum = 0;

function expectError(code, errCode) {
  testNum++;
  var result = RareScript.processCode("test.rare", code, false, true);
  if (!(result instanceof RareScript.RareScriptError)) {
    return console.log(`\x1b[31m❌ Test #${testNum} failed: Didn't got an error.\x1b[0m`);
  }
  if (result.code != errCode) {
    return console.log(`\x1b[31m❌ Test #${testNum} failed: Expected code ${errCode}, but got ${result.code}.\x1b[0m`);
  }
  console.log(`\x1b[32m✅ Test #${testNum} passed.\x1b[0m`);
}

function expectTokens(code, tokens) {
  testNum++;
  var result = RareScript.processCode("test.rare", code, false, true);
  if (result instanceof RareScript.RareScriptError) {
    return console.log(`\x1b[31m❌ Test #${testNum} failed: Got an error ${result.code}.\x1b[0m`);
  }
  if (result.tokens.length != tokens.length) {
    return console.log(`\x1b[31m❌ Test #${testNum} failed: Expected ${tokens.length} tokens, but got ${result.tokens.length}.\x1b[0m`);
  }
  for (var tokenIndex = 0; tokenIndex < tokens.length; tokenIndex++) {
    for (var prop of Object.keys(tokens[tokenIndex])) {
      if (prop == "value") {
        if (RareScript.getTokenValue(code, result.tokens[tokenIndex]) != tokens[tokenIndex][prop]) {
          return console.log(`\x1b[31m❌ Test #${testNum} failed: Token #${tokenIndex + 1} value doesn't match.\x1b[0m`);
        }
      } else if (result.tokens[tokenIndex][prop] != tokens[tokenIndex][prop]) {
        return console.log(`\x1b[31m❌ Test #${testNum} failed: Token #${tokenIndex + 1} property "${prop}" doesn't match.\x1b[0m`);
      }
    }
  }
  console.log(`\x1b[32m✅ Test #${testNum} passed.\x1b[0m`);
}

function expectAST(code, ast) {
  testNum++;
  var result = RareScript.processCode("test.rare", code, false, true);
  if (result instanceof RareScript.RareScriptError) {
    return console.log(`\x1b[31m❌ Test #${testNum} failed: Got an error ${result.code}.\x1b[0m`);
  }
  if (result.ast.length != ast.length) {
    return console.log(`\x1b[31m❌ Test #${testNum} failed: Expected ${ast.length} instructions, but got ${result.ast.length}.\x1b[0m`);
  }
  for (var astIndex = 0; astIndex < ast.length; astIndex++) {
    for (var prop of Object.keys(ast[astIndex])) {
      if (result.ast[astIndex][prop] != ast[astIndex][prop]) {
        return console.log(`\x1b[31m❌ Test #${testNum} failed: Instruction #${astIndex + 1} property "${prop}" doesn't match.\x1b[0m`);
      }
    }
  }
  console.log(`\x1b[32m✅ Test #${testNum} passed.\x1b[0m`);
}

function expectTokensAndAST(code, tokens, ast) {
  testNum++;
  var result = RareScript.processCode("test.rare", code, false, true);
  if (result instanceof RareScript.RareScriptError) {
    return console.log(`\x1b[31m❌ Test #${testNum} failed: Got an error ${result.code}.\x1b[0m`);
  }
  if (result.tokens.length != tokens.length) {
    return console.log(`\x1b[31m❌ Test #${testNum} failed: Expected ${tokens.length} tokens, but got ${result.tokens.length}.\x1b[0m`);
  }
  for (var tokenIndex = 0; tokenIndex < tokens.length; tokenIndex++) {
    for (var prop of Object.keys(tokens[tokenIndex])) {
      if (prop == "value") {
        if (RareScript.getTokenValue(code, result.tokens[tokenIndex]) != tokens[tokenIndex][prop]) {
          return console.log(`\x1b[31m❌ Test #${testNum} failed: Token #${tokenIndex + 1} value doesn't match.\x1b[0m`);
        }
      } else if (result.tokens[tokenIndex][prop] != tokens[tokenIndex][prop]) {
        return console.log(`\x1b[31m❌ Test #${testNum} failed: Token #${tokenIndex + 1} property "${prop}" doesn't match.\x1b[0m`);
      }
    }
  }
  if (result.ast.length != ast.length) {
    return console.log(`\x1b[31m❌ Test #${testNum} failed: Expected ${ast.length} instructions, but got ${result.ast.length}.\x1b[0m`);
  }
  for (var astIndex = 0; astIndex < ast.length; astIndex++) {
    for (var prop of Object.keys(ast[astIndex])) {
      if (JSON.stringify(result.ast[astIndex][prop]) != JSON.stringify(ast[astIndex][prop])) {
        return console.log(`\x1b[31m❌ Test #${testNum} failed: Instruction #${astIndex + 1} property "${prop}" doesn't match.\x1b[0m`);
      }
    }
  }
  console.log(`\x1b[32m✅ Test #${testNum} passed.\x1b[0m`);
}

expectError("import {", 4);
expectError("import console as", 5);
expectError("import console", 6);
expectError("import console as con", 6);
expectTokensAndAST("import console;", [{
  "type": RareScript.TokenType.KEYWORD,
  "value": "import"
}, {
  "type": RareScript.TokenType.IDENTIFIER,
  "value": "console"
}, {
  "type": RareScript.TokenType.SEPARATOR,
  "value": ";"
}], [{
  "type": RareScript.InstructionType.IMPORT,
  "module": "console",
  "as": null
}]);
expectTokensAndAST("import console as con;", [{
  "type": RareScript.TokenType.KEYWORD,
  "value": "import"
}, {
  "type": RareScript.TokenType.IDENTIFIER,
  "value": "console"
}, {
  "type": RareScript.TokenType.KEYWORD,
  "value": "as"
}, {
  "type": RareScript.TokenType.IDENTIFIER,
  "value": "con"
}, {
  "type": RareScript.TokenType.SEPARATOR,
  "value": ";"
}], [{
  "type": RareScript.InstructionType.IMPORT,
  "module": "console",
  "as": "con"
}]);
expectTokensAndAST(`import console;

%%Test!
%% Meow meow-meow
%%%%% A

console::out("Hello, World!"); %% meow
console::out(60 + 1);`, [{
  "type": RareScript.TokenType.KEYWORD,
  "value": "import"
}, {
  "type": RareScript.TokenType.IDENTIFIER,
  "value": "console"
}, {
  "type": RareScript.TokenType.SEPARATOR,
  "value": ";"
}, {
  "type": RareScript.TokenType.IDENTIFIER,
  "value": "console::out"
}, {
  "type": RareScript.TokenType.OPERATOR,
  "value": "("
}, {
  "type": RareScript.TokenType.STRING,
  "value": "\"Hello, World!\""
}, {
  "type": RareScript.TokenType.OPERATOR,
  "value": ")"
}, {
  "type": RareScript.TokenType.SEPARATOR,
  "value": ";"
}, {
  "type": RareScript.TokenType.IDENTIFIER,
  "value": "console::out"
}, {
  "type": RareScript.TokenType.OPERATOR,
  "value": "("
}, {
  "type": RareScript.TokenType.NUMBER,
  "value": "60"
}, {
  "type": RareScript.TokenType.OPERATOR,
  "value": "+"
}, {
  "type": RareScript.TokenType.NUMBER,
  "value": "1"
}, {
  "type": RareScript.TokenType.OPERATOR,
  "value": ")"
}, {
  "type": RareScript.TokenType.SEPARATOR,
  "value": ";"
}], [{
  "type": RareScript.InstructionType.IMPORT,
  "module": "console",
  "as": null
}, {
  "type": RareScript.InstructionType.EXPRESSION,
  "expression": {
    "type": "function",
    "function": "console::out",
    "arguments": [{
      "type": "string",
      "value": "\"Hello, World!\""
    }]
  }
}, {
  "type": RareScript.InstructionType.EXPRESSION,
  "expression": {
    "type": "function",
    "function": "console::out",
    "arguments": [{
      "type": "operator",
      "operator": "+",
      "left": {
        "type": "number",
        "value": "60"
      },
      "right": {
        "type": "number",
        "value": "1"
      }
    }]
  }
}]);