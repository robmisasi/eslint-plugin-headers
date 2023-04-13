"use strict";

var os = require("os");

/**
 * @param {string} text
 * @returns true if text is a shebang directive.
 */
function isShebang(text) {
  return text.startsWith("#!");
}

/**
 * @param {string} text
 * @returns true if text is a docblock.
 */
function isDocblock(text) {
  return text.startsWith("/*") && text.indexOf("*/") === text.length - 2;
}

/**
 * Extracts a docblock from text
 * @param {string} text
 * @returns {string} extracted docblock, or null if none found
 */
function getDocBlock(text) {
  var startIdx = text.indexOf("/*");
  var endIdx = text.indexOf("*/");
  if (startIdx > 0 && endIdx > startIdx) {
    return text.substring(startIdx, endIdx + 2);
  }
  return null;
}

/**
 * @param {string[]} blocks
 * @returns {string} merged docblocks
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

module.exports = {
  getDocBlock,
  isDocblock,
  isShebang,
  mergeDocblocks,
};
