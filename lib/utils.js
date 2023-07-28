/**
 * @fileoverview Helper functions for formatting, generating, and parsing docblocks.
 * @author Rob Misasi
 */
"use strict";

var os = require("os");

var newlineExpression = /(\r\n|\r|\n|\u2028|\u2029)/u;
/**
 * Format docblock with trailing newlines.
 *
 * @param {string} docblock JSDoc to format
 * @param {string} eol End of Line character(s).
 * @param {number} trailingNewlines number of trailing newlines to append to formatted text.
 * @returns
 */
function formatExpectedHeader(docblock, eol, trailingNewlines) {
  var newlines = eol.repeat(trailingNewlines);
  return `${docblock}${newlines}`;
}

/**
 * Generates a JSDoc string containing specified text.
 *
 * @param {string} text Text to be inserted into JSDoc comment.
 * @param {string} eol End of Line character(s).
 * @returns {string} JSDoc comment containing {@link text}
 */
function generateDocblock(text, eol) {
  var docblockLines = text
    .split(eol)
    .map(function (line) {
      return ` * ${line}`.trimEnd();
    })
    .join(eol);
  return `/**${eol}${docblockLines}${eol} */`;
}

/**
 * Extracts a docblock from js code.
 *
 * @param {string} text text to parse.
 * @param {number} position location in {@link text} to begin extraction.
 * @returns {[string, number]} extracted docblock and the position of the end of the docblock in {@link text}, or null if none are found.
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
 * @param {string} eol End of Line character(s).
 * @param {string[]} blocks JSDoc strings to be merged. MUST be valid JSDoc strings.
 * @returns {string} merged docblocks.
 */
function mergeDocblocks(eol, ...blocks) {
  var mergedBlocks = blocks.reduce(function (
    mergedBlock,
    block,
    currentIndex,
    array,
  ) {
    var strippedBlock = block.substring(3, block.length - 2).trimEnd();
    if (currentIndex < array.length - 1) {
      strippedBlock += eol + " *";
    }
    return mergedBlock + strippedBlock;
  },
  "");
  return `/**${mergedBlocks}${eol} */`;
}

/**
 * Extracts text contained in a docblock.
 *
 * @param {string} docblock JSDoc to parse. Assumes this is a valid JSDoc string.
 * @param {string} eol End of Line character(s).
 * @returns {string} text stripped of docblock formatting.
 */
function getDocblockText(docblock, eol) {
  var docblockLines = docblock.split(eol);
  var textLines = docblockLines.slice(1, docblockLines.length - 1);
  return textLines
    .map(function (line) {
      return line.replace(/ \* ?/, "");
    })
    .join(eol);
}

/**
 * Gets End of line character(s) from {@link code}.
 *
 * @param {string} code Code to parse
 * @returns {string} End of Line character from {@link code}
 */
function getEolCharacter(code) {
  var match = newlineExpression.exec(code);
  return (match && match[0]) || os.EOL;
}

module.exports = {
  formatExpectedHeader,
  generateDocblock,
  getDocblock,
  getDocblockText,
  getEolCharacter,
  mergeDocblocks,
};
