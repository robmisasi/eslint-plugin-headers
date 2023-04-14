"use strict";

var os = require("os");

function formatExpectedHeader(text, trailingNewlines) {
  var newlines = `${os.EOL}`.repeat(trailingNewlines);
  return `${text}${newlines}`;
}

/**
 * @param {string} text
 * @returns true if text is a shebang directive.
 */
function isShebang(text) {
  return text.startsWith("#!");
}

/**
 * @param {string} text
 * @returns true if text is a single, valid docblock.
 */
function isDocblock(text) {
  return text.startsWith("/*") && text.indexOf("*/") === text.lastIndexOf("*/");
}

/**
 * Generates a JSDoc string containing specified text.
 *
 * @param {string} text Text to be inserted into JSDoc comment.
 * @returns {string} JSDoc comment containing @see text
 */
function generateDocblock(text) {
  var docblockLines = text
    .split(os.EOL)
    .map((line) => ` * ${line}`.trimEnd())
    .join(os.EOL);
  return `/**${os.EOL}${docblockLines}${os.EOL} */`;
}

/**
 * Extracts a docblock from js code.
 *
 * @param {string} text text to parse.
 * @param {number} position location in @see text to begin extraction.
 * @returns {[string, number]} extracted docblock and the position of the end of the docblock in @see text, or null if none are found.
 */
function getDocblock(text, position = 0) {
  var startIdx = text.indexOf("/*", position);
  var endIdx = text.indexOf("*/", position);
  if (endIdx > startIdx) {
    return [text.substring(startIdx, endIdx + 2), endIdx + 2];
  }
  return null;
}

/**
 * Merge multiple docblocks into a single docblock.
 *
 * @param {string[]} blocks to be merged. Items MUST be valid docblocks.
 * @returns {string} merged docblocks.
 */
function mergeDocblocks(...blocks) {
  var mergedBlocks = blocks.reduce(
    (mergedBlock, block, currentIndex, array) => {
      var strippedBlock = block.substring(3, block.length - 2).trimEnd();
      if (currentIndex < array.length - 1) {
        strippedBlock += os.EOL + " *";
      }
      return mergedBlock + strippedBlock;
    },
    ""
  );
  return `/**${mergedBlocks}${os.EOL} */`;
}

/**
 * Extracts text contained in a docblock.
 *
 * @param {string} docblock JSDoc to parse. Assumes this is a valid JSDoc string.
 * @returns {string} text stripped of docblock formatting.
 */
function getDocblockText(docblock) {
  var docblockLines = docblock.split(os.EOL);
  var textLines = docblockLines.slice(1, docblockLines.length - 1);
  return textLines.map((line) => line.replace(/ \* ?/, "")).join(os.EOL);
}

module.exports = {
  formatExpectedHeader,
  generateDocblock,
  getDocblock,
  getDocblockText,
  isDocblock,
  isShebang,
  mergeDocblocks,
};
