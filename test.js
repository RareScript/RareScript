var RareScript = require("./bootstrap.js");

var testNum = 0;

function expectError(code, errCode) {
  testNum++;
  try {
    var result = RareScript.processCode("test.rare", code, false, true, false);
  } catch {
    return console.log(`\x1b[31m❌ Test #${testNum} failed: Compiler crashed.\x1b[0m`);
  }
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
  try {
    var result = RareScript.processCode("test.rare", code, false, true, false);
  } catch {
    return console.log(`\x1b[31m❌ Test #${testNum} failed: Compiler crashed.\x1b[0m`);
  }
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
  try {
    var result = RareScript.processCode("test.rare", code, false, true, false);
  } catch {
    return console.log(`\x1b[31m❌ Test #${testNum} failed: Compiler crashed.\x1b[0m`);
  }
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
  try {
    var result = RareScript.processCode("test.rare", code, false, true, false);
  } catch {
    return console.log(`\x1b[31m❌ Test #${testNum} failed: Compiler crashed.\x1b[0m`);
  }
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

function expectCode(code, compiled) {
  testNum++;
  try {
    var result = RareScript.processCode("test.rare", code, false, true, false);
  } catch {
    return console.log(`\x1b[31m❌ Test #${testNum} failed: Compiler crashed.\x1b[0m`);
  }
  if (result instanceof RareScript.RareScriptError) {
    return console.log(`\x1b[31m❌ Test #${testNum} failed: Got an error ${result.code}.\x1b[0m`);
  }
  if (result.compiled != compiled) {
    return console.log(`\x1b[31m❌ Test #${testNum} failed: Compiled code does not match.`);
  }
  console.log(`\x1b[32m✅ Test #${testNum} passed.\x1b[0m`);
}

expectError("import {", 4);
expectError("import console as", 5);
expectError("import console", 6);
expectError("import console as con", 6);
expectTokensAndAST("import typing;", [{
  "type": RareScript.TokenType.KEYWORD,
  "value": "import"
}, {
  "type": RareScript.TokenType.IDENTIFIER,
  "value": "typing"
}, {
  "type": RareScript.TokenType.SEPARATOR,
  "value": ";"
}], [{
  "type": RareScript.InstructionType.IMPORT,
  "module": "typing",
  "as": null
}]);
expectTokensAndAST("import typing as tp;", [{
  "type": RareScript.TokenType.KEYWORD,
  "value": "import"
}, {
  "type": RareScript.TokenType.IDENTIFIER,
  "value": "typing"
}, {
  "type": RareScript.TokenType.KEYWORD,
  "value": "as"
}, {
  "type": RareScript.TokenType.IDENTIFIER,
  "value": "tp"
}, {
  "type": RareScript.TokenType.SEPARATOR,
  "value": ";"
}], [{
  "type": RareScript.InstructionType.IMPORT,
  "module": "typing",
  "as": "tp"
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

expectTokensAndAST("import typing; typing::number c2t := 1;", [{
  "type": RareScript.TokenType.KEYWORD,
  "value": "import"
}, {
  "type": RareScript.TokenType.IDENTIFIER,
  "value": "typing"
}, {
  "type": RareScript.TokenType.SEPARATOR,
  "value": ";"
}, {
  "type": RareScript.TokenType.IDENTIFIER,
  "value": "typing::number"
}, {
  "type": RareScript.TokenType.IDENTIFIER,
  "value": "c2t"
}, {
  "type": RareScript.TokenType.OPERATOR,
  "value": ":="
}, {
  "type": RareScript.TokenType.NUMBER,
  "value": "1"
}, {
  "type": RareScript.TokenType.SEPARATOR,
  "value": ";"
}], [{
  "type": RareScript.InstructionType.IMPORT,
  "module": "typing",
  "as": null
}, {
  "type": RareScript.InstructionType.VARIABLE,
  "variableType": {
    "base": "typing::number",
    "subtype": [],
    "star": false
  },
  "name": "c2t",
  "modifiers": [],
  "value": {
    "type": "number",
    "value": "1"
  }
}]);
expectTokensAndAST("import typing; typing::number final c2t := 1;", [{
  "type": RareScript.TokenType.KEYWORD,
  "value": "import"
}, {
  "type": RareScript.TokenType.IDENTIFIER,
  "value": "typing"
}, {
  "type": RareScript.TokenType.SEPARATOR,
  "value": ";"
}, {
  "type": RareScript.TokenType.IDENTIFIER,
  "value": "typing::number"
}, {
  "type": RareScript.TokenType.KEYWORD,
  "value": "final"
}, {
  "type": RareScript.TokenType.IDENTIFIER,
  "value": "c2t"
}, {
  "type": RareScript.TokenType.OPERATOR,
  "value": ":="
}, {
  "type": RareScript.TokenType.NUMBER,
  "value": "1"
}, {
  "type": RareScript.TokenType.SEPARATOR,
  "value": ";"
}], [{
  "type": RareScript.InstructionType.IMPORT,
  "module": "typing",
  "as": null
}, {
  "type": RareScript.InstructionType.VARIABLE,
  "variableType": {
    "base": "typing::number",
    "subtype": [],
    "star": false
  },
  "name": "c2t",
  "modifiers": ["final"],
  "value": {
    "type": "number",
    "value": "1"
  }
}]);
expectError("typing::number a := ;", 9);

expectTokensAndAST("import console; console::out(1..5);", [{
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
  "type": RareScript.TokenType.NUMBER,
  "value": "1"
}, {
  "type": RareScript.TokenType.OPERATOR,
  "value": ".."
}, {
  "type": RareScript.TokenType.NUMBER,
  "value": "5"
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
      "type": "operator",
      "operator": "..",
      "left": {
        "type": "number",
        "value": "1"
      },
      "right": {
        "type": "number",
        "value": "5"
      }
    }]
  }
}]);
expectTokensAndAST(`import console; console::out("cat"->2 = 'a');`, [{
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
  "value": "\"cat\""
}, {
  "type": RareScript.TokenType.OPERATOR,
  "value": "->"
}, {
  "type": RareScript.TokenType.NUMBER,
  "value": "2"
}, {
  "type": RareScript.TokenType.OPERATOR,
  "value": "="
}, {
  "type": RareScript.TokenType.CHAR,
  "value": "'a'"
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
      "type": "operator",
      "operator": "=",
      "left": {
        "type": "operator",
        "operator": "->",
        "left": {
          "type": "string",
          "value": "\"cat\""
        },
        "right": {
          "type": "number",
          "value": "2"
        }
      },
      "right": {
        "type": "char",
        "value": "'a'"
      }
    }]
  }
}]);
expectTokensAndAST("import console; console::out(-1.59);", [{
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
  "type": RareScript.TokenType.NUMBER,
  "value": "-1.59"
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
      "type": "number",
      "value": "-1.59"
    }]
  }
}]);
expectError("console::out('a);", 1);
expectError(`console::out("a);`, 2);
expectError(`console::out("a\n`, 0);
expectTokensAndAST("import console; console::out(1-2,-2,1+-2,1--2,a-2,-getOne()-2);", [{
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
  "type": RareScript.TokenType.NUMBER,
  "value": "1"
}, {
  "type": RareScript.TokenType.OPERATOR,
  "value": "-"
}, {
  "type": RareScript.TokenType.NUMBER,
  "value": "2"
}, {
  "type": RareScript.TokenType.OPERATOR,
  "value": ","
}, {
  "type": RareScript.TokenType.NUMBER,
  "value": "-2"
}, {
  "type": RareScript.TokenType.OPERATOR,
  "value": ","
}, {
  "type": RareScript.TokenType.NUMBER,
  "value": "1"
}, {
  "type": RareScript.TokenType.OPERATOR,
  "value": "+"
}, {
  "type": RareScript.TokenType.NUMBER,
  "value": "-2"
}, {
  "type": RareScript.TokenType.OPERATOR,
  "value": ","
}, {
  "type": RareScript.TokenType.NUMBER,
  "value": "1"
}, {
  "type": RareScript.TokenType.OPERATOR,
  "value": "-"
}, {
  "type": RareScript.TokenType.NUMBER,
  "value": "-2"
}, {
  "type": RareScript.TokenType.OPERATOR,
  "value": ","
}, {
  "type": RareScript.TokenType.IDENTIFIER,
  "value": "a"
}, {
  "type": RareScript.TokenType.OPERATOR,
  "value": "-"
}, {
  "type": RareScript.TokenType.NUMBER,
  "value": "2"
}, {
  "type": RareScript.TokenType.OPERATOR,
  "value": ","
}, {
  "type": RareScript.TokenType.OPERATOR,
  "value": "-"
}, {
  "type": RareScript.TokenType.IDENTIFIER,
  "value": "getOne"
}, {
  "type": RareScript.TokenType.OPERATOR,
  "value": "("
}, {
  "type": RareScript.TokenType.OPERATOR,
  "value": ")"
}, {
  "type": RareScript.TokenType.OPERATOR,
  "value": "-"
}, {
  "type": RareScript.TokenType.NUMBER,
  "value": "2"
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
      "type": "operator",
      "operator": "-",
      "left": {
        "type": "number",
        "value": "1"
      },
      "right": {
        "type": "number",
        "value": "2"
      }
    }, {
      "type": "number",
      "value": "-2"
    }, {
      "type": "operator",
      "operator": "+",
      "left": {
        "type": "number",
        "value": "1"
      },
      "right": {
        "type": "number",
        "value": "-2"
      }
    }, {
      "type": "operator",
      "operator": "-",
      "left": {
        "type": "number",
        "value": "1"
      },
      "right": {
        "type": "number",
        "value": "-2"
      }
    }, {
      "type": "operator",
      "operator": "-",
      "left": {
        "type": "identifier",
        "value": "a"
      },
      "right": {
        "type": "number",
        "value": "2"
      }
    }, {
      "type": "operator",
      "operator": "-",
      "left": {
        "type": "operator",
        "operator": "-",
        "left": null,
        "right": {
          "type": "function",
          "function": "getOne",
          "arguments": []
        }
      },
      "right": {
        "type": "number",
        "value": "2"
      }
    }]
  }
}]);
expectTokensAndAST("1 + 2 * 3 - 4 + 5;", [{
  "type": RareScript.TokenType.NUMBER,
  "value": "1"
}, {
  "type": RareScript.TokenType.OPERATOR,
  "value": "+"
}, {
  "type": RareScript.TokenType.NUMBER,
  "value": "2"
}, {
  "type": RareScript.TokenType.OPERATOR,
  "value": "*"
}, {
  "type": RareScript.TokenType.NUMBER,
  "value": "3"
}, {
  "type": RareScript.TokenType.OPERATOR,
  "value": "-"
}, {
  "type": RareScript.TokenType.NUMBER,
  "value": "4"
}, {
  "type": RareScript.TokenType.OPERATOR,
  "value": "+"
}, {
  "type": RareScript.TokenType.NUMBER,
  "value": "5"
}, {
  "type": RareScript.TokenType.SEPARATOR,
  "value": ";"
}], [{
  "type": RareScript.InstructionType.EXPRESSION,
  "expression": {
    "type": "operator",
    "operator": "+",
    "left": {
      "type": "operator",
      "operator": "-",
      "left": {
        "type": "operator",
        "operator": "+",
        "left": {
          "type": "number",
          "value": "1"
        },
        "right": {
          "type": "operator",
          "operator": "*",
          "left": {
            "type": "number",
            "value": "2"
          },
          "right": {
            "type": "number",
            "value": "3"
          }
        }
      },
      "right": {
        "type": "number",
        "value": "4"
      }
    },
    "right": {
      "type": "number",
      "value": "5"
    }
  }
}]);
expectError("as con;", 3);
expectError("return 1", 10);
expectError("return;", 11);
expectTokensAndAST("return 1;", [{
  "type": RareScript.TokenType.KEYWORD,
  "value": "return"
}, {
  "type": RareScript.TokenType.NUMBER,
  "value": "1"
}, {
  "type": RareScript.TokenType.SEPARATOR,
  "value": ";"
}], [{
  "type": RareScript.InstructionType.RETURN,
  "value": {
    "type": "number",
    "value": "1"
  }
}]);
expectTokensAndAST(`typing::number getOne(typing::string test, typing::number *a) {
  return 1;
}`, [{
  "type": RareScript.TokenType.IDENTIFIER,
  "value": "typing::number"
}, {
  "type": RareScript.TokenType.IDENTIFIER,
  "value": "getOne"
}, {
  "type": RareScript.TokenType.OPERATOR,
  "value": "("
}, {
  "type": RareScript.TokenType.IDENTIFIER,
  "value": "typing::string"
}, {
  "type": RareScript.TokenType.IDENTIFIER,
  "value": "test"
}, {
  "type": RareScript.TokenType.OPERATOR,
  "value": ","
}, {
  "type": RareScript.TokenType.IDENTIFIER,
  "value": "typing::number"
}, {
  "type": RareScript.TokenType.OPERATOR,
  "value": "*"
}, {
  "type": RareScript.TokenType.IDENTIFIER,
  "value": "a"
}, {
  "type": RareScript.TokenType.OPERATOR,
  "value": ")"
}, {
  "type": RareScript.TokenType.OPERATOR,
  "value": "{"
}, {
  "type": RareScript.TokenType.KEYWORD,
  "value": "return"
}, {
  "type": RareScript.TokenType.NUMBER,
  "value": "1"
}, {
  "type": RareScript.TokenType.SEPARATOR,
  "value": ";"
}, {
  "type": RareScript.TokenType.OPERATOR,
  "value": "}"
}], [{
  "type": RareScript.InstructionType.FUNCTION,
  "returnType": {
    "base": "typing::number",
    "subtype": [],
    "star": false
  },
  "name": "getOne",
  "arguments": [{
    "type": {
      "base": "typing::string",
      "subtype": []
    },
    "name": "test",
    "spreading": false
  }, {
    "type": {
      "base": "typing::number",
      "subtype": []
    },
    "name": "a",
    "spreading": true
  }],
  "content": [{
    "type": RareScript.InstructionType.RETURN,
    "value": {
      "type": "number",
      "value": "1"
    },
    "line": 2
  }]
}]);

expectTokensAndAST(`cond true { return 1; }`, [{
  "type": RareScript.TokenType.KEYWORD,
  "value": "cond"
}, {
  "type": RareScript.TokenType.KEYWORD,
  "value": "true"
}, {
  "type": RareScript.TokenType.OPERATOR,
  "value": "{"
}, {
  "type": RareScript.TokenType.KEYWORD,
  "value": "return"
}, {
  "type": RareScript.TokenType.NUMBER,
  "value": "1"
}, {
  "type": RareScript.TokenType.SEPARATOR,
  "value": ";"
}, {
  "type": RareScript.TokenType.OPERATOR,
  "value": "}"
}], [{
  "type": RareScript.InstructionType.CONDITION,
  "condition": {
    "type": "boolean",
    "value": "true"
  },
  "true": [{
    "type": RareScript.InstructionType.RETURN,
    "value": {
      "type": "number",
      "value": "1"
    },
    "line": 1
  }],
  "false": null
}]);
expectTokensAndAST(`cond true { return 1; } else { return 2; }`, [{
  "type": RareScript.TokenType.KEYWORD,
  "value": "cond"
}, {
  "type": RareScript.TokenType.KEYWORD,
  "value": "true"
}, {
  "type": RareScript.TokenType.OPERATOR,
  "value": "{"
}, {
  "type": RareScript.TokenType.KEYWORD,
  "value": "return"
}, {
  "type": RareScript.TokenType.NUMBER,
  "value": "1"
}, {
  "type": RareScript.TokenType.SEPARATOR,
  "value": ";"
}, {
  "type": RareScript.TokenType.OPERATOR,
  "value": "}"
}, {
  "type": RareScript.TokenType.KEYWORD,
  "value": "else"
}, {
  "type": RareScript.TokenType.OPERATOR,
  "value": "{"
}, {
  "type": RareScript.TokenType.KEYWORD,
  "value": "return"
}, {
  "type": RareScript.TokenType.NUMBER,
  "value": "2"
}, {
  "type": RareScript.TokenType.SEPARATOR,
  "value": ";"
}, {
  "type": RareScript.TokenType.OPERATOR,
  "value": "}"
}], [{
  "type": RareScript.InstructionType.CONDITION,
  "condition": {
    "type": "boolean",
    "value": "true"
  },
  "true": [{
    "type": RareScript.InstructionType.RETURN,
    "value": {
      "type": "number",
      "value": "1"
    },
    "line": 1
  }],
  "false": [{
    "type": RareScript.InstructionType.RETURN,
    "value": {
      "type": "number",
      "value": "2"
    },
    "line": 1
  }]
}]);

expectCode("import std;", "var std = {};");
expectCode(`import std; std::out("Hello, World!\\n");`, `var std = {};std.out = data => void process.stdout.write(data);std.out("Hello, World!\\n");`);

expectError("import typing; typing::string := 1;", 1);