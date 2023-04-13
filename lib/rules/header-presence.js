/**
 * @fileoverview Verifies the presence of a particular string in a file's first docblock
 * @author Rob Misasi
 */
"use strict";

var { isShebang } = require("../utils");

/**
 *
 * @param {string} src
 * @returns
 */
function hasHeaderComment(src) {
  if (isShebang(src)) {
    var m = src.match(/(\r\n|\r|\n)/);
    if (m) {
      src = src.slice(m.index + m[0].length);
    }
  }
  return src.startsWith("/*");
}
//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "layout",
    docs: {
      description:
        "Verifies the presence of a particular string in a file's first docblock",
      recommended: false,
    },
    messages: {
      fileHeader: "File missing header.",
    },
    fixable: "code",
    schema: [
      {
        type: "object",
        properties: {
          type: {
            enum: ["file", "string"],
          },
          content: {
            type: "string",
          },
        },
      },
    ],
  },

  create(context) {
    //----------------------------------------------------------------------
    // Helpers
    //----------------------------------------------------------------------

    // any helper functions should go here or else delete this section

    //----------------------------------------------------------------------
    // Public
    //----------------------------------------------------------------------

    return {
      // visitor functions for different types of nodes
      Program: function (node) {
        if (!hasHeaderComment(context.getSourceCode().getText())) {
          context.report({
            loc: node.loc,
            messageId: "fileHeader",
          });
        }
      },
    };
  },
};
