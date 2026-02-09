var util = require("util");
var babelCore = null;

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
  "SCOPE": 1,
  "EXPRESSION": 2,
  "VARIABLE": 3,
  "CONDITION": 4,
  "FUNCTION": 5,
  "RETURN": 6
};

var operators = {
  "**": {
    "type": (filename, line, left, right) => {
      if (!left) {
        return new RareScriptError(filename, line, 53, "Expected left side");
      }
      if (!right) {
        return new RareScriptError(filename, line, 54, "Expected right side");
      }
      if (left.type.base != "typing::number" || right.type.base != "typing::number") {
        return new RareScriptError(filename, line, 55, "Operator expects typing::number");
      }
      return {
        "base": "typing::number",
        "subtype": [],
        "star": false
      };
    },
    "js": (_filename, _line, left, right) => {
      return `${left}.pow((${right}).toNumber())`;
    }
  },
  "*": {
    "type": (filename, line, left, right) => {
      if (!left) {
        return new RareScriptError(filename, line, 37, "Expected left side");
      }
      if (!right) {
        return new RareScriptError(filename, line, 38, "Expected right side");
      }
      if (left.type.base != "typing::number" || right.type.base != "typing::number") {
        return new RareScriptError(filename, line, 24, "Operator expects typing::number");
      }
      return {
        "base": "typing::number",
        "subtype": [],
        "star": false
      };
    },
    "js": (_filename, _line, left, right) => {
      return `${left}.mul(${right})`;
    }
  },
  "/": {
    "type": (filename, line, left, right) => {
      if (!left) {
        return new RareScriptError(filename, line, 39, "Expected left side");
      }
      if (!right) {
        return new RareScriptError(filename, line, 40, "Expected right side");
      }
      if (left.type.base != "typing::number" || right.type.base != "typing::number") {
        return new RareScriptError(filename, line, 25, "Operator expects typing::number");
      }
      return {
        "base": "typing::number",
        "subtype": [],
        "star": false
      };
    },
    "js": (_filename, _line, left, right) => {
      return `${left}.div(${right})`;
    }
  },
  "//": {
    "type": (filename, line, left, right) => {
      if (!left) {
        return new RareScriptError(filename, line, 56, "Expected left side");
      }
      if (!right) {
        return new RareScriptError(filename, line, 57, "Expected right side");
      }
      if (left.type.base != "typing::number" || right.type.base != "typing::number") {
        return new RareScriptError(filename, line, 58, "Operator expects typing::number");
      }
      return {
        "base": "typing::number",
        "subtype": [],
        "star": false
      };
    },
    "js": (_filename, _line, left, right) => {
      return `${left}.div(${right}).round(0, RSNumber.roundDown)`;
    }
  },
  "%": {
    "type": (filename, line, left, right) => {
      if (!left) {
        return new RareScriptError(filename, line, 41, "Expected left side");
      }
      if (!right) {
        return new RareScriptError(filename, line, 42, "Expected right side");
      }
      if (left.type.base != "typing::number" || right.type.base != "typing::number") {
        return new RareScriptError(filename, line, 26, "Operator expects typing::number");
      }
      return {
        "base": "typing::number",
        "subtype": [],
        "star": false
      };
    },
    "js": (_filename, _line, left, right) => {
      return `${left}.mod(${right})`;
    }
  },
  "+": {
    "type": (filename, line, left, right) => {
      if (!right) {
        return new RareScriptError(filename, line, 34, "Expected right side");
      }
      if (!left) {
        if (right.type.base != "typing::number") {
          return new RareScriptError(filename, line, 33, "Expected right side to be typing::number");
        }
        return {
          "base": "typing::number",
          "subtype": [],
          "star": false
        };
      }
      if (left.type.base == "typing::string" || left.type.base == "typing::char") {
        if (right.type.base != "typing::string" && right.type.base != "typing::char") {
          return new RareScriptError(filename, line, 20, "Expected right side to be typing::string or typing::char");
        }
        return {
          "base": "typing::string",
          "subtype": [],
          "star": false
        };
      }
      if (left.type.base == "typing::number") {
        if (right.type.base != "typing::number") {
          return new RareScriptError(filename, line, 21, "Expected right side to be typing::number");
        }
        return {
          "base": "typing::number",
          "subtype": [],
          "star": false
        };
      }
      return new RareScriptError(filename, line, 22, "Operator does not accept this type");
    },
    "js": (_filename, _line, left, right, leftType) => {
      if (!left) {
        return `${right}.abs()`;
      }
      if (leftType.type.base == "typing::string" || leftType.type.base == "typing::char") {
        return `${left} + ${right}`;
      }
      if (leftType.type.base == "typing::number") {
        return `${left}.add(${right})`;
      }
    }
  },
  "-": {
    "type": (filename, line, left, right) => {
      if (!right) {
        return new RareScriptError(filename, line, 36, "Expected right side");
      }
      if (!left) {
        if (right.type.base != "typing::number") {
          return new RareScriptError(filename, line, 35, "Expected right side to be typing::number");
        }
        return {
          "base": "typing::number",
          "subtype": [],
          "star": false
        };
      }
      if (left.type.base != "typing::number" || right.type.base != "typing::number") {
        return new RareScriptError(filename, line, 23, "Operator expects typing::number");
      }
      return {
        "base": "typing::number",
        "subtype": [],
        "star": false
      };
    },
    "js": (_filename, _line, left, right) => {
      return left ? `${left}.sub(${right})` : `${right}.neg()`;
    }
  },
  "<<": {
    "type": (filename, line, left, right) => {
      if (!left) {
        return new RareScriptError(filename, line, 59, "Expected left side");
      }
      if (!right) {
        return new RareScriptError(filename, line, 60, "Expected right side");
      }
      if (left.type.base != "typing::number" || right.type.base != "typing::number") {
        return new RareScriptError(filename, line, 61, "Operator expects typing::number");
      }
      return {
        "base": "typing::number",
        "subtype": [],
        "star": false
      };
    },
    "js": (_filename, _line, left, right) => {
      return `new RSNumber(${left} << ${right})`
    }
  },
  ">>": {
    "type": (filename, line, left, right) => {
      if (!left) {
        return new RareScriptError(filename, line, 62, "Expected left side");
      }
      if (!right) {
        return new RareScriptError(filename, line, 63, "Expected right side");
      }
      if (left.type.base != "typing::number" || right.type.base != "typing::number") {
        return new RareScriptError(filename, line, 64, "Operator expects typing::number");
      }
      return {
        "base": "typing::number",
        "subtype": [],
        "star": false
      };
    },
    "js": (_filename, _line, left, right) => {
      return `new RSNumber(${left} >> ${right})`
    }
  },
  "|": {
    "type": (filename, line, left, right) => {
      if (!left) {
        return new RareScriptError(filename, line, 65, "Expected left side");
      }
      if (!right) {
        return new RareScriptError(filename, line, 66, "Expected right side");
      }
      if (left.type.base != "typing::number" || right.type.base != "typing::number") {
        return new RareScriptError(filename, line, 67, "Operator expects typing::number");
      }
      return {
        "base": "typing::number",
        "subtype": [],
        "star": false
      };
    },
    "js": (_filename, _line, left, right) => {
      return `new RSNumber(${left} | ${right})`
    }
  },
  "&": {
    "type": (filename, line, left, right) => {
      if (!left) {
        return new RareScriptError(filename, line, 68, "Expected left side");
      }
      if (!right) {
        return new RareScriptError(filename, line, 69, "Expected right side");
      }
      if (left.type.base != "typing::number" || right.type.base != "typing::number") {
        return new RareScriptError(filename, line, 70, "Operator expects typing::number");
      }
      return {
        "base": "typing::number",
        "subtype": [],
        "star": false
      };
    },
    "js": (_filename, _line, left, right) => {
      return `new RSNumber(${left} & ${right})`
    }
  },
  "^": {
    "type": (filename, line, left, right) => {
      if (!left) {
        return new RareScriptError(filename, line, 71, "Expected left side");
      }
      if (!right) {
        return new RareScriptError(filename, line, 72, "Expected right side");
      }
      if (left.type.base != "typing::number" || right.type.base != "typing::number") {
        return new RareScriptError(filename, line, 73, "Operator expects typing::number");
      }
      return {
        "base": "typing::number",
        "subtype": [],
        "star": false
      };
    },
    "js": (_filename, _line, left, right) => {
      return `new RSNumber(${left} ^ ${right})`
    }
  },
  "|>": {
    "type": (filename, line, left, right) => {
      if (!left) {
        return new RareScriptError(filename, line, 74, "Expected left side");
      }
      if (!right) {
        return new RareScriptError(filename, line, 75, "Expected right side");
      }
      if (right.type.base != "typing::function" || right.type.subtype.length != 2 || JSON.stringify(right.type.subtype[0]) != JSON.stringify(left.type)) {
        return new RareScriptError(filename, line, 76, `Expected "typing::function<${renderType(left.type)}, typing::any>" on right side`);
      }
      return right.type.subtype[1];
    },
    "js": (_filename, _line, left, right) => {
      return `${right}(${left})`;
    }
  },
  "=": {
    "type": (filename, line, left, right) => {
      if (!left) {
        return new RareScriptError(filename, line, 77, "Expected left side");
      }
      if (!right) {
        return new RareScriptError(filename, line, 78, "Expected right side");
      }
      if (left.type.base != "typing::any" && right.type.base != "typing::any" && JSON.stringify(left.type) != JSON.stringify(right.type)) {
        return new RareScriptError(filename, line, 79, "Comparing different types is always false");
      }
      return {
        "base": "typing::boolean",
        "subtype": [],
        "star": false
      };
    },
    "jsExtra": `var equals = (a, b) => (typeof RSNumber !== "undefined" && a instanceof RSNumber && b instanceof RSNumber) ? a.toString() === b.toString() : a === b;`,
    "js": (_filename, _line, left, right) => {
      return `equals(${left}, ${right})`;
    }
  },
  "!=": {
    "type": (filename, line, left, right) => {
      if (!left) {
        return new RareScriptError(filename, line, 80, "Expected left side");
      }
      if (!right) {
        return new RareScriptError(filename, line, 81, "Expected right side");
      }
      if (left.type.base != "typing::any" && right.type.base != "typing::any" && JSON.stringify(left.type) != JSON.stringify(right.type)) {
        return new RareScriptError(filename, line, 82, "Comparing different types is always false");
      }
      return {
        "base": "typing::boolean",
        "subtype": [],
        "star": false
      };
    },
    "jsExtra": `var equals = (a, b) => (typeof RSNumber !== "undefined" && a instanceof RSNumber && b instanceof RSNumber) ? a.toString() === b.toString() : a === b;`,
    "js": (_filename, _line, left, right) => {
      return `!equals(${left}, ${right})`;
    }
  },
  "<": {
    "type": (filename, line, left, right) => {
      if (!left) {
        return new RareScriptError(filename, line, 83, "Expected left side");
      }
      if (!right) {
        return new RareScriptError(filename, line, 84, "Expected right side");
      }
      if (left.type.base != "typing::number" || right.type.base != "typing::number") {
        return new RareScriptError(filename, line, 85, "Operator expects typing::number");
      }
      return {
        "base": "typing::boolean",
        "subtype": [],
        "star": false
      };
    },
    "js": (_filename, _line, left, right) => {
      return `${left}.cmp(${right}) == -1`;
    }
  },
  ">": {
    "type": (filename, line, left, right) => {
      if (!left) {
        return new RareScriptError(filename, line, 86, "Expected left side");
      }
      if (!right) {
        return new RareScriptError(filename, line, 87, "Expected right side");
      }
      if (left.type.base != "typing::number" || right.type.base != "typing::number") {
        return new RareScriptError(filename, line, 88, "Operator expects typing::number");
      }
      return {
        "base": "typing::boolean",
        "subtype": [],
        "star": false
      };
    },
    "js": (_filename, _line, left, right) => {
      return `${left}.cmp(${right}) == 1`;
    }
  },
  "<=": {
    "type": (filename, line, left, right) => {
      if (!left) {
        return new RareScriptError(filename, line, 89, "Expected left side");
      }
      if (!right) {
        return new RareScriptError(filename, line, 90, "Expected right side");
      }
      if (left.type.base != "typing::number" || right.type.base != "typing::number") {
        return new RareScriptError(filename, line, 91, "Operator expects typing::number");
      }
      return {
        "base": "typing::boolean",
        "subtype": [],
        "star": false
      };
    },
    "js": (_filename, _line, left, right) => {
      return `${left}.cmp(${right}) < 1`;
    }
  },
  ">=": {
    "type": (filename, line, left, right) => {
      if (!left) {
        return new RareScriptError(filename, line, 92, "Expected left side");
      }
      if (!right) {
        return new RareScriptError(filename, line, 93, "Expected right side");
      }
      if (left.type.base != "typing::number" || right.type.base != "typing::number") {
        return new RareScriptError(filename, line, 94, "Operator expects typing::number");
      }
      return {
        "base": "typing::boolean",
        "subtype": [],
        "star": false
      };
    },
    "js": (_filename, _line, left, right) => {
      return `${left}.cmp(${right}) > -1`;
    }
  },
  "!": {
    "type": (filename, line, left, right) => {
      if (left) {
        return new RareScriptError(filename, line, 95, "Operator does not accept left side");
      }
      if (!right) {
        return new RareScriptError(filename, line, 96, "Expected right side");
      }
      if (right.type.base != "typing::boolean") {
        return new RareScriptError(filename, line, 97, "Operator expects typing::boolean");
      }
      return {
        "base": "typing::boolean",
        "subtype": [],
        "star": false
      };
    },
    "js": (_filename, _line, _left, right) => {
      return `!${right}`;
    }
  },
  "or": {
    "type": (filename, line, left, right) => {
      if (!left) {
        return new RareScriptError(filename, line, 98, "Expected left side");
      }
      if (!right) {
        return new RareScriptError(filename, line, 99, "Expected right side");
      }
      if (left.type.base != "typing::boolean" || right.type.base != "typing::boolean") {
        return new RareScriptError(filename, line, 100, "Operator expects typing::boolean");
      }
      return {
        "base": "typing::boolean",
        "subtype": [],
        "star": false
      };
    },
    "js": (_filename, _line, left, right) => {
      return `${left} || ${right}`;
    }
  },
  "and": {
    "type": (filename, line, left, right) => {
      if (!left) {
        return new RareScriptError(filename, line, 101, "Expected left side");
      }
      if (!right) {
        return new RareScriptError(filename, line, 102, "Expected right side");
      }
      if (left.type.base != "typing::boolean" || right.type.base != "typing::boolean") {
        return new RareScriptError(filename, line, 103, "Operator expects typing::boolean");
      }
      return {
        "base": "typing::boolean",
        "subtype": [],
        "star": false
      };
    },
    "js": (_filename, _line, left, right) => {
      return `${left} && ${right}`;
    }
  },
  ":=": {
    "leftRaw": true,
    "type": (filename, line, left, right) => {
      if (!left) {
        return new RareScriptError(filename, line, 104, "Expected left side");
      }
      if (!right) {
        return new RareScriptError(filename, line, 105, "Expected right side");
      }
      if (left.modifiers.includes("final")) {
        return new RareScriptError(filename, line, 111, "Cannot assign to a final variable");
      }
      if (JSON.stringify(left.type) != JSON.stringify(right.type)) {
        return new RareScriptError(filename, line, 106, `Cannot assign "${renderType(right.type)}" as "${renderType(left.type)}"`);
      }
      return right;
    },
    "js": (filename, line, left, right) => {
      if (left.type != "identifier") {
        return new RareScriptError(filename, line, 107, "Expected identifier on left side");
      }
      var namespace = null;
      var variableName = left.value;
      if (variableName.includes("::")) {
        [namespace, variableName] = variableName.split("::");
      }
      return `(${namespace ? `${namespace}.` : ""}${variableName} = ${right})`;
    }
  }
};

var operatorPriority = [
  [".."],
  ["->", "->@"],
  ["**"],
  ["*", "/", "//", "%"],
  ["+", "-"],
  ["<<", ">>"],
  ["|", "&", "^"],
  ["|>"],
  ["=", "!=", "<", ">", "<=", ">="],
  ["!"],
  ["or", "and"],
  [":="]
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

var builtinModules = {
  "typing": {
    "variables": new Map([
      ["void", {
        "type": {
          "base": "typing::function",
          "subtype": [{
            "base": "typing::any",
            "subtype": [],
            "star": true
          }, {
            "base": "typing::void",
            "subtype": [],
            "star": false
          }],
          "star": false
        },
        "modifiers": ["type", "final"],
        "js": "() => {}"
      }],
      ["string", {
        "type": {
          "base": "typing::function",
          "subtype": [{
            "base": "typing::any",
            "subtype": [],
            "star": true
          }, {
            "base": "typing::string",
            "subtype": [],
            "star": false
          }],
          "star": false
        },
        "modifiers": ["type", "final"],
        "js": `data => data === void 0 ? "" : data.toString()`
      }],
      ["char", {
        "type": {
          "base": "typing::function",
          "subtype": [{
            "base": "typing::any",
            "subtype": [],
            "star": true
          }, {
            "base": "typing::char",
            "subtype": [],
            "star": false
          }],
          "star": false
        },
        "modifiers": ["type", "final"],
        // TODO: Add converter
        "js": "data => {}"
      }],
      ["number", {
        "type": {
          "base": "typing::function",
          "subtype": [{
            "base": "typing::any",
            "subtype": [],
            "star": true
          }, {
            "base": "typing::number",
            "subtype": [],
            "star": false
          }],
          "star": false
        },
        "modifiers": ["type", "numbers", "final"],
        "js": `data => new RSNumber(data === void 0 ? 0 : (typeof data === "boolean" ? +data : data))`
      }],
      ["boolean", {
        "type": {
          "base": "typing::function",
          "subtype": [{
            "base": "typing::any",
            "subtype": [],
            "star": true
          }, {
            "base": "typing::boolean",
            "subtype": [],
            "star": false
          }],
          "star": false
        },
        "modifiers": ["type", "final"],
        "js": `data => new Boolean((typeof RSNumber !== "undefined" && data instanceof RSNumber) ? parseFloat(data.toString()) : data) == 1`
      }],
      ["function", {
        "type": {
          "base": "typing::function",
          "subtype": [{
            "base": "typing::any",
            "subtype": [],
            "star": true
          }, {
            "base": "typing::function",
            "subtype": [{
              "base": "typing::any",
              "subtype": [],
              "star": false
            }],
            "star": false
          }],
          "star": false
        },
        "modifiers": ["type", "final"],
        "js": "data => data"
      }],
      ["any", {
        "type": {
          "base": "typing::void",
          "subtype": [],
          "star": false
        },
        "modifiers": ["type", "final"]
      }]
    ])
  },
  "std": {
    "variables": new Map([
      ["out", {
        "type": {
          "base": "typing::function",
          "subtype": [{
            "base": "typing::string",
            "subtype": [],
            "star": false
          }, {
            "base": "typing::void",
            "subtype": [],
            "star": false
          }],
          "star": false
        },
        "modifiers": ["final"],
        "jsExtra": {
          "crossplatform": `var stdoutBuffer = "";`,
          "browser": `var stdoutBuffer = "";`,
          "nodejs": null
        },
        "js": {
          "crossplatform": `data => {if (typeof process === "undefined") {stdoutBuffer += data;if (data.includes("\\n")) {var lines = stdoutBuffer.split("\\n");stdoutBuffer = lines.pop();console.log(lines.join("\\n"));}} else {process.stdout.write(data);}}`,
          "browser": `data => {stdoutBuffer += data;if (data.includes("\\n")) {var lines = stdoutBuffer.split("\\n");stdoutBuffer = lines.pop();console.log(lines.join("\\n"));}}`,
          "nodejs": "data => process.stdout.write(data)"
        }
      }]
    ])
  }
};

var numberClass = `!function(r){"use strict";var e,t=1e6,n=1e6,o="Invalid ",s=o+"decimal places",c="Division by zero",f={},u=void 0,h=/^-?(\\d+(\\.\\d*)?|\\.\\d+)(e[+-]?\\d+)?$/i;function l(r,e,t,n){var i=r.c;if(t===u&&(t=r.constructor.RM),0!==t&&1!==t&&2!==t&&3!==t)throw Error("Invalid rounding mode");if(e<1)n=3===t&&(n||!!i[0])||0===e&&(1===t&&i[0]>=5||2===t&&(i[0]>5||5===i[0]&&(n||i[1]!==u))),i.length=1,n?(r.e=r.e-e+1,i[0]=1):i[0]=r.e=0;else if(e<i.length){if(n=1===t&&i[e]>=5||2===t&&(i[e]>5||5===i[e]&&(n||i[e+1]!==u||1&i[e-1]))||3===t&&(n||!!i[0]),i.length=e,n)for(;++i[--e]>9;)if(i[e]=0,0===e){++r.e,i.unshift(1);break}for(e=i.length;!i[--e];)i.pop()}return r}function a(r,e,t){var n=r.e,i=r.c.join(""),o=i.length;if(e)i=i.charAt(0)+(o>1?"."+i.slice(1):"")+(n<0?"e":"e+")+n;else if(n<0){for(;++n;)i="0"+i;i="0."+i}else if(n>0)if(++n>o)for(n-=o;n--;)i+="0";else n<o&&(i=i.slice(0,n)+"."+i.slice(n));else o>1&&(i=i.charAt(0)+"."+i.slice(1));return r.s<0&&t?"-"+i:i}f.abs=function(){var r=new this.constructor(this);return r.s=1,r},f.cmp=function(r){var e,t=this,n=t.c,i=(r=new t.constructor(r)).c,o=t.s,s=r.s,c=t.e,f=r.e;if(!n[0]||!i[0])return n[0]?o:i[0]?-s:0;if(o!=s)return o;if(e=o<0,c!=f)return c>f^e?1:-1;for(s=(c=n.length)<(f=i.length)?c:f,o=-1;++o<s;)if(n[o]!=i[o])return n[o]>i[o]^e?1:-1;return c==f?0:c>f^e?1:-1},f.div=function(r){var e=this,n=e.constructor,i=e.c,o=(r=new n(r)).c,f=e.s==r.s?1:-1,h=n.DP;if(h!==~~h||h<0||h>t)throw Error(s);if(!o[0])throw Error(c);if(!i[0])return r.s=f,r.c=[r.e=0],r;var a,p,g,w,v,d=o.slice(),m=a=o.length,E=i.length,b=i.slice(0,a),P=b.length,D=r,M=D.c=[],x=0,y=h+(D.e=e.e-r.e)+1;for(D.s=f,f=y<0?0:y,d.unshift(0);P++<a;)b.push(0);do{for(g=0;g<10;g++){if(a!=(P=b.length))w=a>P?1:-1;else for(v=-1,w=0;++v<a;)if(o[v]!=b[v]){w=o[v]>b[v]?1:-1;break}if(!(w<0))break;for(p=P==a?o:d;P;){if(b[--P]<p[P]){for(v=P;v&&!b[--v];)b[v]=9;--b[v],b[P]+=10}b[P]-=p[P]}for(;!b[0];)b.shift()}M[x++]=w?g:++g,b[0]&&w?b[P]=i[m]||0:b=[i[m]]}while((m++<E||b[0]!==u)&&f--);return M[0]||1==x||(M.shift(),D.e--,y--),x>y&&l(D,y,n.RM,b[0]!==u),D},f.eq=function(r){return 0===this.cmp(r)},f.gt=function(r){return this.cmp(r)>0},f.gte=function(r){return this.cmp(r)>-1},f.lt=function(r){return this.cmp(r)<0},f.lte=function(r){return this.cmp(r)<1},f.minus=f.sub=function(r){var e,t,n,i,o=this,s=o.constructor,c=o.s,f=(r=new s(r)).s;if(c!=f)return r.s=-f,o.plus(r);var u=o.c.slice(),h=o.e,l=r.c,a=r.e;if(!u[0]||!l[0])return l[0]?r.s=-f:u[0]?r=new s(o):r.s=1,r;if(c=h-a){for((i=c<0)?(c=-c,n=u):(a=h,n=l),n.reverse(),f=c;f--;)n.push(0);n.reverse()}else for(t=((i=u.length<l.length)?u:l).length,c=f=0;f<t;f++)if(u[f]!=l[f]){i=u[f]<l[f];break}if(i&&(n=u,u=l,l=n,r.s=-r.s),(f=(t=l.length)-(e=u.length))>0)for(;f--;)u[e++]=0;for(f=e;t>c;){if(u[--t]<l[t]){for(e=t;e&&!u[--e];)u[e]=9;--u[e],u[t]+=10}u[t]-=l[t]}for(;0===u[--f];)u.pop();for(;0===u[0];)u.shift(),--a;return u[0]||(r.s=1,u=[a=0]),r.c=u,r.e=a,r},f.mod=function(r){var e,t=this,n=t.constructor,i=t.s,o=(r=new n(r)).s;if(!r.c[0])throw Error(c);return t.s=r.s=1,e=1==r.cmp(t),t.s=i,r.s=o,e?new n(t):(i=n.DP,o=n.RM,n.DP=n.RM=0,t=t.div(r),n.DP=i,n.RM=o,this.minus(t.times(r)))},f.neg=function(){var r=new this.constructor(this);return r.s=-r.s,r},f.plus=f.add=function(r){var e,t,n,i=this,o=i.constructor;if(r=new o(r),i.s!=r.s)return r.s=-r.s,i.minus(r);var s=i.e,c=i.c,f=r.e,u=r.c;if(!c[0]||!u[0])return u[0]||(c[0]?r=new o(i):r.s=i.s),r;if(c=c.slice(),e=s-f){for(e>0?(f=s,n=u):(e=-e,n=c),n.reverse();e--;)n.push(0);n.reverse()}for(c.length-u.length<0&&(n=u,u=c,c=n),e=u.length,t=0;e;c[e]%=10)t=(c[--e]=c[e]+u[e]+t)/10|0;for(t&&(c.unshift(t),++f),e=c.length;0===c[--e];)c.pop();return r.c=c,r.e=f,r},f.pow=function(r){var e=this,t=new e.constructor("1"),i=t,s=r<0;if(r!==~~r||r<-1e6||r>n)throw Error(o+"exponent");for(s&&(r=-r);1&r&&(i=i.times(e)),r>>=1;)e=e.times(e);return s?t.div(i):i},f.prec=function(r,e){if(r!==~~r||r<1||r>t)throw Error(o+"precision");return l(new this.constructor(this),r,e)},f.round=function(r,e){if(r===u)r=0;else if(r!==~~r||r<-t||r>t)throw Error(s);return l(new this.constructor(this),r+this.e+1,e)},f.sqrt=function(){var r,e,t,n=this,o=n.constructor,s=n.s,c=n.e,f=new o("0.5");if(!n.c[0])return new o(n);if(s<0)throw Error("No square root");0===(s=Math.sqrt(n+""))||s===1/0?((e=n.c.join("")).length+c&1||(e+="0"),c=((c+1)/2|0)-(c<0||1&c),r=new o(((s=Math.sqrt(e))==1/0?"5e":(s=s.toExponential()).slice(0,s.indexOf("e")+1))+c)):r=new o(s+""),c=r.e+(o.DP+=4);do{t=r,r=f.times(t.plus(n.div(t)))}while(t.c.slice(0,c).join("")!==r.c.slice(0,c).join(""));return l(r,(o.DP-=4)+r.e+1,o.RM)},f.times=f.mul=function(r){var e,t=this,n=t.constructor,i=t.c,o=(r=new n(r)).c,s=i.length,c=o.length,f=t.e,u=r.e;if(r.s=t.s==r.s?1:-1,!i[0]||!o[0])return r.c=[r.e=0],r;for(r.e=f+u,s<c&&(e=i,i=o,o=e,u=s,s=c,c=u),e=new Array(u=s+c);u--;)e[u]=0;for(f=c;f--;){for(c=0,u=s+f;u>f;)c=e[u]+o[f]*i[u-f-1]+c,e[u--]=c%10,c=c/10|0;e[u]=c}for(c?++r.e:e.shift(),f=e.length;!e[--f];)e.pop();return r.c=e,r},f.toExponential=function(r,e){var n=this,i=n.c[0];if(r!==u){if(r!==~~r||r<0||r>t)throw Error(s);for(n=l(new n.constructor(n),++r,e);n.c.length<r;)n.c.push(0)}return a(n,!0,!!i)},f.toFixed=function(r,e){var n=this,i=n.c[0];if(r!==u){if(r!==~~r||r<0||r>t)throw Error(s);for(r=r+(n=l(new n.constructor(n),r+n.e+1,e)).e+1;n.c.length<r;)n.c.push(0)}return a(n,!1,!!i)},f.toJSON=f.toString=function(){var r=this,e=r.constructor;return a(r,r.e<=e.NE||r.e>=e.PE,!!r.c[0])},f.toNumber=function(){var r=Number(a(this,!0,!0));if(!0===this.constructor.strict&&!this.eq(r.toString()))throw Error("Imprecise conversion");return r},f.toPrecision=function(r,e){var n=this,i=n.constructor,s=n.c[0];if(r!==u){if(r!==~~r||r<1||r>t)throw Error(o+"precision");for(n=l(new i(n),r,e);n.c.length<r;)n.c.push(0)}return a(n,r<=n.e||n.e<=i.NE||n.e>=i.PE,!!s)},f.valueOf=function(){var r=this,e=r.constructor;if(!0===e.strict)throw Error("valueOf disallowed");return a(r,r.e<=e.NE||r.e>=e.PE,!0)},e=function r(){function e(t){var n=this;if(!(n instanceof e))return t===u?r():new e(t);if(t instanceof e)n.s=t.s,n.e=t.e,n.c=t.c.slice();else{if("string"!=typeof t){if(!0===e.strict&&"bigint"!=typeof t)throw TypeError(o+"value");t=0===t&&1/t<0?"-0":String(t)}!function(r,e){var t,n,i;if(!h.test(e))throw Error(o+"number");r.s="-"==e.charAt(0)?(e=e.slice(1),-1):1,(t=e.indexOf("."))>-1&&(e=e.replace(".",""));(n=e.search(/e/i))>0?(t<0&&(t=n),t+=+e.slice(n+1),e=e.substring(0,n)):t<0&&(t=e.length);for(i=e.length,n=0;n<i&&"0"==e.charAt(n);)++n;if(n==i)r.c=[r.e=0];else{for(;i>0&&"0"==e.charAt(--i););for(r.e=t-n-1,r.c=[],t=0;n<=i;)r.c[t++]=+e.charAt(n++)}}(n,t)}n.constructor=e}return e.prototype=f,e.DP=1e3,e.RM=1,e.NE=-1e6,e.PE=1e6,e.strict=false,e.roundDown=0,e.roundHalfUp=1,e.roundHalfEven=2,e.roundUp=3,e}(),e.default=e.RSNumber=e,r.RSNumber=e}(globalThis);`;

function lexer(filename, code) {
  var tokens = [];
  var currentLine = 1;
  var currentToken = "";
  var isString = false;
  var tokenSeparators = [" ", "\n", ";", "(", ")", "{", "}", ","];
  var digits = "0123456789";
  var symbols = "!@#$%^&*-+\\|/=";
  var keywords = ["import", "as", "scope", "return", "cond", "else", "false", "true", "maybe", "and", "or", "final"];
  var operators = ["(", ")", "{", "}", ",", "**", "+", "-", "*", "/", "//", "%", "=", "!=", ":=", "..", "->", "->@", "<", ">", "|", "&", "^", "<<", ">>", "<=", ">=", "|>"];

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

function parseType(code, tokens) {
  var hasStar = false;
  if (tokens.length == 2 && getTokenValue(code, tokens[0]) == "*") {
    tokens.shift();
    hasStar = true;
  }
  var type = {
    "base": getTokenValue(code, tokens.shift()),
    "subtype": [[]],
    "star": hasStar
  };
  if (tokens.length < 2) {
    type.subtype = [];
    return type;
  }
  tokens.shift();
  var bracketDepth = 0;
  for (var tokenIndex = 0; tokenIndex < tokens.length - 1; tokenIndex++) {
    var token = tokens[tokenIndex];
    if (getTokenValue(code, token) == "<") {
      bracketDepth++;
    }
    if (getTokenValue(code, token) == ">") {
      bracketDepth--;
    }
    if (getTokenValue(code, token) == "," && !bracketDepth) {
      type.subtype.push([]);
    } else {
      type.subtype.at(-1).push(token);
    }
  }
  if (type.subtype.length == 1 && !type.subtype[0].length) {
    type.subtype = [];
  }
  type.subtype = type.subtype.map(subtype => parseType(code, subtype));
  return type;
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
            "as": getTokenValue(code, as),
            "line": token.line
          });
          continue;
        case "scope":
          var module = expectToken(TokenType.IDENTIFIER);
          if (!module) {
            return new RareScriptError(filename, token.line, 113, "Expected module name");
          }
          requireSeparator();
          ast.push({
            "type": InstructionType.SCOPE,
            "module": getTokenValue(code, module),
            "line": token.line
          });
          continue;
        case "cond":
          var condition = [];
          while(!expectToken("{")) {
            condition.push(takeToken());
          }
          if (!condition.length) {
            return new RareScriptError(filename, token.line, 14, "Expected a condition");
          }
          var bracketDepth = 1;
          for (var tokenIndex = 0; tokenIndex < tokens.length; tokenIndex++) {
            if (getTokenValue(code, tokens[tokenIndex]) == "{") {
              bracketDepth++;
            }
            if (getTokenValue(code, tokens[tokenIndex]) == "}") {
              if (!--bracketDepth) {
                break;
              }
            }
          }
          var trueContent = tokens.splice(0, tokenIndex);
          var falseContent = null;
          expectToken("}");
          if (expectToken("else")) {
            if (!expectToken("{")) {
              return new RareScriptError(filename, token.line, 15, "Expected {");
            }
            var bracketDepth = 1;
            for (var tokenIndex = 0; tokenIndex < tokens.length; tokenIndex++) {
              if (getTokenValue(code, tokens[tokenIndex]) == "{") {
                bracketDepth++;
              }
              if (getTokenValue(code, tokens[tokenIndex]) == "}") {
                if (!--bracketDepth) {
                  break;
                }
              }
            }
            falseContent = tokens.splice(0, tokenIndex);
            expectToken("}");
          }
          ast.push({
            "type": InstructionType.CONDITION,
            "condition": parseExpression(filename, code, condition),
            "true": parser(filename, code, trueContent),
            "false": falseContent ? parser(filename, code, falseContent) : null,
            "line": token.line
          });
          continue;
        case "return":
          var value = [];
          while(!expectToken(TokenType.SEPARATOR)) {
            var expressionToken = takeToken();
            if (!expressionToken) {
              return new RareScriptError(filename, token.line, 10, "Expected separator, got EOF");
            }
            value.push(expressionToken);
          }
          if (!value.length) {
            return new RareScriptError(filename, token.line, 11, "Expected return value");
          }
          ast.push({
            "type": InstructionType.RETURN,
            "value": parseExpression(filename, code, value),
            "line": token.line
          });
          continue;
        default:
          return new RareScriptError(filename, token.line, 3, `Unexpected keyword "${value}"`);
      }
    }
    if (token.type == TokenType.IDENTIFIER) {
      var type = {
        "base": getTokenValue(code, token),
        "subtype": [],
        "star": false
      };
      var nameStart = 0;
      if (expectToken("<")) {
        var bracketDepth = 1;
        for (var tokenIndex = 0; tokenIndex < tokens.length; tokenIndex++) {
          if (getTokenValue(code, tokens[tokenIndex]) == "<") {
            bracketDepth++;
          }
          if (getTokenValue(code, tokens[tokenIndex]) == ">") {
            if (!--bracketDepth) {
              break;
            }
          }
        }
        type = parseType(code, [token, lastToken, ...tokens.slice(0, tokenIndex + 1)]);
        nameStart = tokenIndex + 1;
      }

      // Variables
      var name = null;
      var modifiers = [];
      if (tokens[nameStart].type == TokenType.IDENTIFIER && getTokenValue(code, tokens[nameStart + 1]) == ":=") {
        tokens = tokens.slice(nameStart);
        name = getTokenValue(code, takeToken());
        expectToken(":=");
      } else if (getTokenValue(code, tokens[nameStart]) == "final" && tokens[nameStart + 1].type == TokenType.IDENTIFIER && getTokenValue(code, tokens[nameStart + 2]) == ":=") {
        tokens = tokens.slice(nameStart);
        modifiers.push(getTokenValue(code, takeToken()));
        name = getTokenValue(code, takeToken());
        expectToken(":=");
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
          "value": parseExpression(filename, code, value),
          "line": token.line
        });
        continue;
      }

      // Functions
      if (tokens[nameStart].type == TokenType.IDENTIFIER && getTokenValue(code, tokens[nameStart + 1]) == "(") {
        tokens = tokens.slice(nameStart);
        var name = getTokenValue(code, takeToken());
        expectToken("(");
        var args = [];
        while(!expectToken(")")) {
          if (args.length) {
            if (!expectToken(",")) {
              return new RareScriptError(filename, token.line, 13, "Expected comma between arguments");
            }
          }
          var argumentTypeBase = takeToken();
          var argumentType = {
            "base": getTokenValue(code, argumentTypeBase),
            "subtype": [],
            "star": false
          };
          if (expectToken("<")) {
            var bracketDepth = 1;
            for (var tokenIndex = 0; tokenIndex < tokens.length; tokenIndex++) {
              if (getTokenValue(code, tokens[tokenIndex]) == "<") {
                bracketDepth++;
              }
              if (getTokenValue(code, tokens[tokenIndex]) == ">") {
                if (!--bracketDepth) {
                  break;
                }
              }
            }
            argumentType = parseType(code, [argumentTypeBase, lastToken, ...tokens.splice(0, tokenIndex + 1)]);
          }
          if (expectToken("*")) {
            argumentType.star = true;
          }
          var argumentName = getTokenValue(code, takeToken());
          args.push({
            "type": argumentType,
            "name": argumentName
          });
        }
        if (!expectToken("{")) {
          return new RareScriptError(filename, token.line, 12, "Expected {");
        }
        var bracketDepth = 1;
        for (var tokenIndex = 0; tokenIndex < tokens.length; tokenIndex++) {
          if (getTokenValue(code, tokens[tokenIndex]) == "{") {
            bracketDepth++;
          }
          if (getTokenValue(code, tokens[tokenIndex]) == "}") {
            if (!--bracketDepth) {
              break;
            }
          }
        }
        var content = tokens.splice(0, tokenIndex);
        expectToken("}");
        ast.push({
          "type": InstructionType.FUNCTION,
          "returnType": type,
          name,
          "arguments": args,
          "content": parser(filename, code, content),
          "line": token.line
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
    expression = parseExpression(filename, code, expression);
    if (!expression) {
      return new RareScriptError(filename, token.line, 117, "Invalid expression");
    }
    ast.push({
      "type": InstructionType.EXPRESSION,
      expression,
      "line": token.line
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
    } else if (tokens[0].type == TokenType.KEYWORD && ["true", "false", "maybe"].includes(getTokenValue(code, tokens[0]))) {
      return {
        "type": "boolean",
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
        } else if (tokens[0].type == TokenType.KEYWORD && ["true", "false", "maybe"].includes(getTokenValue(code, tokens[0]))) {
          expression.left = {
            "type": "boolean",
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
        } else if (tokens.at(-1).type == TokenType.KEYWORD && ["true", "false", "maybe"].includes(getTokenValue(code, tokens.at(-1)))) {
          expression.right = {
            "type": "boolean",
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

function renderType(type) {
  return `${type.star ? "*" : ""}${type.base}${type.subtype.length ? `<${type.subtype.map(renderType).join(", ")}>` : ""}`;
}

function compiler(filename, ast, target) {
  var namespaces = new Map;
  var scopes = [];
  var typeTransformationTable = new Map;
  var globalVariables = new Map;
  var contexts = [];
  var compiled = [
    [], [], []
  ];
  var addedFunctions = new Set;
  var numberClassAdded = false;
  var cachedError = null;
  var lastInstruction = null;
  var importStreak = true;

  function compileExpression(expression) {
    if (cachedError) {
      return cachedError;
    }
    if (expression.type == "boolean") {
      if (expression.value == "maybe") {
        return "(!Math.floor(Math.random() *2))";
      } else {
        return expression.value;
      }
    }
    if (expression.type == "identifier") {
      return expression.value;
    }
    if (expression.type == "number") {
      numberClassAdded = true;
      return `(new RSNumber("${expression.value}"))`;
    }
    if (expression.type == "string") {
      return expression.value;
    }
    if (expression.type == "operator") {
      if (typeof operators[expression.operator].type === "function") {
        var leftType = expression.left ? solveExpressionType(expression.left) : null;
        var rightType = expression.right ? solveExpressionType(expression.right) : null;
        if (cachedError) {
          return cachedError;
        }
        if (operators[expression.operator].jsExtra && !compiled[1].includes(operators[expression.operator].jsExtra)) {
          compiled[1].push(operators[expression.operator].jsExtra);
        }
        var result = operators[expression.operator].type(filename, lastInstruction.line, leftType, rightType);
        if (result instanceof RareScriptError) {
          cachedError = result;
          return result;
        }
      }
      var left = expression.left;
      var right = expression.right;
      if (!operators[expression.operator].leftRaw) {
        left = (left ? compileExpression(left) : null);
      }
      if (!operators[expression.operator].rightRaw) {
        right = (right ? compileExpression(right) : null);
      }
      return operators[expression.operator].js(filename, lastInstruction.line, left, right, expression.left ? solveExpressionType(expression.left) : null, expression.right ? solveExpressionType(expression.right) : null);
    }
    if (expression.type == "function") {
      var namespace = null;
      var functionName = expression.function;
      if (functionName.includes("::")) {
        [namespace, functionName] = functionName.split("::");
      }
      if (namespace && !namespaces.get(namespace).variables.has(functionName)) {
        cachedError = new RareScriptError(filename, lastInstruction.line, 45, `Variable "${namespace ? `${namespace}::` : ""}${functionName}" does not exist`);
        return cachedError;
      }
      function applyNamespace(namespace) {
        if (namespace && !addedFunctions.has(`${namespace}::${functionName}`)) {
          if (!namespaces.has(namespace)) {
            cachedError = new RareScriptError(filename, lastInstruction.line, 17, `Namespace "${namespace}" does not exist`);
            return cachedError;
          }
          addedFunctions.add(`${namespace}::${functionName}`);
          if (namespaces.get(namespace).variables.get(functionName).jsExtra && typeof namespaces.get(namespace).variables.get(functionName).jsExtra === "object") {
            var jsExtra = namespaces.get(namespace).variables.get(functionName).jsExtra[target];
            if (jsExtra && !compiled[1].includes(jsExtra)) {
              compiled[1].push(jsExtra);
            }
          }
          if (typeof namespaces.get(namespace).variables.get(functionName).js === "object") {
            compiled[2].push(`${namespace}.${functionName} = ${namespaces.get(namespace).variables.get(functionName).js[target]};`);
          } else {
            compiled[2].push(`${namespace}.${functionName} = ${namespaces.get(namespace).variables.get(functionName).js};`);
          }
        }
        if (namespace && namespaces.get(namespace).variables.get(functionName).modifiers.includes("numbers")) {
          numberClassAdded = true;
        }
      }
      var applyResult = applyNamespace(namespace);
      if (applyResult instanceof RareScriptError) {
        return applyResult;
      }
      var argumentsTypesCorrect = null;
      if (namespace) {
        argumentsTypesCorrect = namespaces.get(namespace).variables.get(functionName).type.subtype.slice(0, -1);
      } else {
        for (var contextIndex = (contexts.length - 1); contextIndex >= 0; contextIndex--) {
          var context = contexts[contextIndex];
          if (context.variables.has(functionName)) {
            argumentsTypesCorrect = context.variables.get(functionName).type.subtype.slice(0, -1);
            break;
          }
        }
        if (!argumentsTypesCorrect) {
          if (globalVariables.has(functionName)) {
            argumentsTypesCorrect = globalVariables.get(functionName).type.subtype.slice(0, -1);
          } else {
            for (var scopedNamespace of scopes) {
              if (namespaces.get(scopedNamespace).variables.has(functionName)) {
                namespace = scopedNamespace;
                argumentsTypesCorrect = namespaces.get(scopedNamespace).variables.get(functionName).type.subtype.slice(0, -1);
                break;
              }
            }
            if (!argumentsTypesCorrect) {
              cachedError = new RareScriptError(filename, lastInstruction.line, 114, `Variable "${functionName}" does not exist`);
              return cachedError;
            }
            var applyResult = applyNamespace(namespace);
            if (applyResult instanceof RareScriptError) {
              return applyResult;
            }
          }
        }
      }
      var argumentsTypes = expression.arguments.map(solveExpressionType).map(argument => argument.type);
      if (cachedError) {
        return cachedError;
      }
      if (argumentsTypesCorrect.length != argumentsTypes.length) {
        cachedError = new RareScriptError(filename, lastInstruction.line, 18, `Expected ${argumentsTypesCorrect.length} arguments, but got ${argumentsTypes.length}`);
        return cachedError;
      }
      for (var argumentIndex = 0; argumentIndex < argumentsTypes.length; argumentIndex++) {
        if (argumentsTypesCorrect[argumentIndex].base == "typing::any") {
          continue;
        }
        if (JSON.stringify(argumentsTypesCorrect[argumentIndex]) != JSON.stringify(argumentsTypes[argumentIndex])) {
          cachedError = new RareScriptError(filename, lastInstruction.line, 19, `Expected argument type ${renderType(argumentsTypesCorrect[argumentIndex])}, but got ${renderType(argumentsTypes[argumentIndex])}`);
          return cachedError;
        }
      }
      return `${namespace ? `${namespace}.` : ""}${functionName}(${expression.arguments.map(compileExpression).join(", ")})`;
    }
  }

  function solveExpressionType(expression) {
    if (expression.type == "boolean") {
      return {
        "type": {
          "base": "typing::boolean",
          "subtype": [],
          "star": false
        },
        "modifiers": []
      };
    }
    if (expression.type == "identifier") {
      var namespace = null;
      var variableName = expression.value;
      if (variableName.includes("::")) {
        [namespace, variableName] = variableName.split("::");
      }
      if (namespace) {
        if (!namespaces.has(namespace)) {
          cachedError = new RareScriptError(filename, lastInstruction.line, 109, `Namespace "${namespace}" does not exist`);
          return cachedError;
        }
        if (!namespaces.get(namespace).variables.has(variableName)) {
          cachedError = new RareScriptError(filename, lastInstruction.line, 110, `Variable "${namespace}::${variableName}" does not exist`);
          return cachedError;
        }
        return namespaces.get(namespace).variables.get(variableName);
      }
      for (var contextIndex = (contexts.length - 1); contextIndex >= 0; contextIndex--) {
        var context = contexts[contextIndex];
        if (context.variables.has(expression.value)) {
          return context.variables.get(expression.value);
        }
      }
      if (globalVariables.has(expression.value)) {
        return globalVariables.get(expression.value);
      }
      cachedError = new RareScriptError(filename, lastInstruction.line, 28, `Variable "${expression.value}" does not exist`);
      return cachedError;
    }
    if (expression.type == "number") {
      return {
        "type": {
          "base": "typing::number",
          "subtype": [],
          "star": false
        },
        "modifiers": []
      };
    }
    if (expression.type == "string") {
      return {
        "type": {
          "base": "typing::string",
          "subtype": [],
          "star": false
        },
        "modifiers": []
      };
    }
    if (expression.type == "operator") {
      if (typeof operators[expression.operator].type === "object") {
        return operators[expression.operator].type;
      }
      var left = (expression.left ? solveExpressionType(expression.left) : null);
      var right = (expression.right ? solveExpressionType(expression.right) : null);
      if (cachedError) {
        return cachedError;
      }
      var result = operators[expression.operator].type(filename, lastInstruction.line, left, right);
      if (result instanceof RareScriptError) {
        cachedError = result;
      }
      return {
        "type": result,
        "modifiers": []
      };
    }
    if (expression.type == "function") {
      var namespace = null;
      var functionName = expression.function;
      if (functionName.includes("::")) {
        [namespace, functionName] = functionName.split("::");
      }
      if (namespace) {
        if (!namespaces.has(namespace)) {
          cachedError = new RareScriptError(filename, lastInstruction.line, 43, `Namespace "${namespace}" does not exist`);
          return cachedError;
        }
        if (!namespaces.get(namespace).variables.has(functionName)) {
          cachedError = new RareScriptError(filename, lastInstruction.line, 44, `Variable "${namespace}::${functionName}" does not exist`);
          return cachedError;
        }
        return {
          "type": namespaces.get(namespace).variables.get(functionName).type.subtype.at(-1),
          "modifiers": []
        };
      }
      for (var contextIndex = (contexts.length - 1); contextIndex >= 0; contextIndex--) {
        var context = contexts[contextIndex];
        if (context.variables.has(functionName)) {
          return {
            "type": context.variables.get(functionName).type.subtype.at(-1),
            "modifiers": []
          };
        }
      }
      if (globalVariables.has(functionName)) {
        return {
          "type": globalVariables.get(functionName).type.subtype.at(-1),
          "modifiers": []
        };
      }
      for (var scopedNamespace of scopes) {
        if (namespaces.get(scopedNamespace).variables.has(functionName)) {
          return {
            "type": namespaces.get(scopedNamespace).variables.get(functionName).type.subtype.at(-1),
            "modifiers": []
          };
        }
      }
      cachedError = new RareScriptError(filename, lastInstruction.line, 50, `Variable "${functionName}" does not exist`);
      return cachedError;
    }
  }

  function transformType(type) {
    if (type.base.includes("::")) {
      var [namespace, name] = type.base.split("::");
      if (typeTransformationTable.has(namespace)) {
        namespace = typeTransformationTable.get(namespace);
      }
      type.base = `${namespace}::${name}`;
    }
    type.subtype = type.subtype.map(transformType);
    return type;
  }

  function checkMissingReturns(ast) {
    for (var instruction of ast) {
      if (instruction.false && instruction.type == InstructionType.CONDITION && checkMissingReturns(instruction.true) && checkMissingReturns(instruction.false)) {
        return true;
      }
      if (instruction.type == InstructionType.RETURN) {
        return true;
      }
    }
    return false;
  }

  function compileAST(ast) {
    for (var instruction of ast) {
      lastInstruction = instruction;
      if (cachedError) {
        return cachedError;
      }
      if (instruction.type != InstructionType.IMPORT && instruction.type != InstructionType.SCOPE) {
        importStreak = false;
      }
      if (instruction.type == InstructionType.IMPORT) {
        if (!importStreak) {
          return new RareScriptError(filename, instruction.line, 108, "Imports should be at the start of top-level");
        }
        if (builtinModules[instruction.module]) {
          if (instruction.as) {
            typeTransformationTable.set(instruction.as, instruction.module);
          }
          namespaces.set(instruction.as || instruction.module, builtinModules[instruction.module]);
          compiled[0].push(`var ${instruction.as || instruction.module} = {};`);
          continue;
        }
        return new RareScriptError(filename, instruction.line, 16, `Module "${instruction.module}" not found`);
      }
      if (instruction.type == InstructionType.SCOPE) {
        if (!importStreak) {
          return new RareScriptError(filename, instruction.line, 118, "Scopes should be at the start of top-level");
        }
        if (!namespaces.has(instruction.module)) {
          return new RareScriptError(filename, instruction.line, 115, `Namespace "${namespace}" does not exist`);
        }
        if (scopes.includes(instruction.module)) {
          return new RareScriptError(filename, instruction.line, 116, `Namespace "${namespace}" is already in the scope`);
        }
        scopes.push(instruction.module);
      }
      if (instruction.type == InstructionType.EXPRESSION) {
        compiled.push(compileExpression(instruction.expression) + ";");
      }
      if (instruction.type == InstructionType.VARIABLE) {
        var context = globalVariables;
        if (contexts.length) {
          context = contexts.at(-1).variables;
        }
        if (context.has(instruction.name)) {
          return new RareScriptError(filename, instruction.line, 27, `Variable "${instruction.name}" already exists`);
        }
        var typeNamespace = null;
        var type = instruction.variableType.base;
        if (type.includes("::")) {
          [typeNamespace, type] = type.split("::");
        }
        if (typeNamespace && !namespaces.has(typeNamespace)) {
          return new RareScriptError(filename, instruction.line, 29, `Namespace "${typeNamespace}" does not exist`);
        }
        if ((!typeNamespace && !globalVariables.has(type)) || (typeNamespace && !namespaces.get(typeNamespace).variables.has(type))) {
          return new RareScriptError(filename, instruction.line, 30, `Variable "${typeNamespace ? `${typeNamespace}::` : ""}${type}" does not exist`);
        }
        if ((!typeNamespace && !globalVariables.get(type).modifiers.includes("type")) || (typeNamespace && !namespaces.get(typeNamespace).variables.get(type).modifiers.includes("type"))) {
          return new RareScriptError(filename, instruction.line, 31, `Variable "${typeNamespace ? `${typeNamespace}::` : ""}${type}" is not a type`);
        }
        var valueType = solveExpressionType(instruction.value);
        var transformedType = transformType(instruction.variableType);
        if (JSON.stringify(transformedType) != JSON.stringify(valueType.type)) {
          return new RareScriptError(filename, instruction.line, 32, `Cannot assign "${renderType(valueType.type)}" as "${renderType(instruction.variableType)}"`);
        }
        context.set(instruction.name, {
          "type": transformedType,
          "modifiers": instruction.modifiers
        });
        compiled.push(`let ${instruction.name} = ${compileExpression(instruction.value)};`);
      }
      if (instruction.type == InstructionType.CONDITION) {
        compiled.push(`if (${compileExpression(instruction.condition)}) {`);
        contexts.push({
          "owner": instruction,
          "variables": new Map
        });
        var result = compileAST(instruction.true);
        if (result instanceof RareScriptError) {
          return result;
        }
        contexts.pop();
        if (instruction.false) {
          compiled.push("} else {");
          contexts.push({
            "owner": instruction,
            "variables": new Map
          });
          result = compileAST(instruction.false);
          if (result instanceof RareScriptError) {
            return result;
          }
          contexts.pop();
          compiled.push("}");
        } else {
          compiled.push("}");
        }
      }
      if (instruction.type == InstructionType.FUNCTION) {
        var context = globalVariables;
        if (contexts.length) {
          context = contexts.at(-1).variables;
        }
        if (context.has(instruction.name)) {
          return new RareScriptError(filename, instruction.line, 46, `Variable "${instruction.name}" already exists`);
        }
        var typeNamespace = null;
        var type = instruction.returnType.base;
        if (type.includes("::")) {
          [typeNamespace, type] = type.split("::");
        }
        if (typeNamespace && !namespaces.has(typeNamespace)) {
          return new RareScriptError(filename, instruction.line, 47, `Namespace "${typeNamespace}" does not exist`);
        }
        if ((!typeNamespace && !globalVariables.has(type)) || (typeNamespace && !namespaces.get(typeNamespace).variables.has(type))) {
          return new RareScriptError(filename, instruction.line, 48, `Variable "${typeNamespace ? `${typeNamespace}::` : ""}${type}" does not exist`);
        }
        if ((!typeNamespace && !globalVariables.get(type).modifiers.includes("type")) || (typeNamespace && !namespaces.get(typeNamespace).variables.get(type).modifiers.includes("type"))) {
          return new RareScriptError(filename, instruction.line, 49, `Variable "${typeNamespace ? `${typeNamespace}::` : ""}${type}" is not a type`);
        }
        context.set(instruction.name, {
          "type": {
            "base": "typing::function",
            "subtype": [...instruction.arguments.map(argument => argument.type), transformType(instruction.returnType)],
            "star": false
          },
          "modifiers": []
        });
        compiled.push(`function ${instruction.name}(${instruction.arguments.map(argument => argument.name).join(", ")}) {`);
        contexts.push({
          "owner": instruction,
          "variables": new Map(instruction.arguments.map(argument => [
            argument.name,
            {
              "type": argument.type,
              "modifiers": ["argument"]
            }
          ]))
        });
        if (instruction.returnType.base != "typing::void" && !checkMissingReturns(instruction.content)) {
          return new RareScriptError(filename, instruction.line, 112, "Not all code paths return");
        }
        var result = compileAST(instruction.content);
        if (result instanceof RareScriptError) {
          return result;
        }
        contexts.pop();
        compiled.push("}");
      }
      if (instruction.type == InstructionType.RETURN) {
        var correctType = null;
        for (var contextIndex = (contexts.length - 1); contextIndex >= 0; contextIndex--) {
          var context = contexts[contextIndex];
          if (context.owner && context.owner.type == InstructionType.FUNCTION) {
            correctType = context.owner.returnType;
            break;
          }
        }
        if (!correctType) {
          return new RareScriptError(filename, lastInstruction.line, 51, "Cannot use return outside of function");
        }
        var valueType = solveExpressionType(instruction.value).type;
        if (JSON.stringify(valueType) != JSON.stringify(correctType)) {
          return new RareScriptError(filename, lastInstruction.line, 52, `Cannot return type "${renderType(valueType)}", expected "${renderType(correctType)}" instead`);
        }
        compiled.push(`return ${compileExpression(instruction.value)};`);
      }
    }
  }
  var result = compileAST(ast);
  if (result instanceof RareScriptError) {
    return result;
  }
  if (cachedError) {
    return cachedError;
  }

  return (numberClassAdded ? numberClass : "") + compiled.flat().join("");
}

function processCode(filename, code, target, debug, supressErrors, minify) {
  if (!["crossplatform", "browser", "nodejs"].includes(target)) {
    throw `Target "${target}" does not exist.`;
  }

  code = code.split("\ufeff").join("").split("\r\n").join("\n");

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

  var compiled = compiler(filename, ast, target);
  if (compiled instanceof RareScriptError) {
    if (supressErrors) {
      return compiled;
    }
    return throwError(compiled, code);
  }
  if (debug) {
    console.log(`\x1b[32m[DEBUG / ${compiled.length} CHARACTERS]\x1b[0m`);
    console.log(compiled);
  }

  if (minify) {
    if (!babelCore) {
      babelCore = require("@babel/core");
    }
    compiled = babelCore.transformSync(compiled, {
      "presets": [
        ["minify", {
          "mangle": {
            "topLevel": true
          }
        }]
      ],
      "generatorOpts": {
        "jsescOption": {
          "minimal": true
        }
      }
    }).code;
    if (compiled.endsWith(";")) {
      compiled = compiled.slice(0, -1);
    }
    if (debug) {
      console.log(`\x1b[32m[DEBUG / ${compiled.length} CHARACTERS / MINIFIED]\x1b[0m`);
      console.log(compiled);
    }
  }

  return { tokens, ast, compiled };
}

if (typeof module !== "undefined") {
  if (require.main == module) {
    var fs = require("fs");
    var path = require("path");
    var code = fs.readFileSync(process.argv[2]).toString("utf-8");
    var result = processCode(path.basename(process.argv[2]), code, "crossplatform", true, false, true);
    if (!(result instanceof RareScriptError)) {
      eval(result.compiled);
    }
  }
  module.exports = { TokenType, getTokenValue, InstructionType, RareScriptError, lexer, parser, parseExpression, processCode };
}