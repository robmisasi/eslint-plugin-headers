"use strict";

var { EOL } = require("os");
var assert = require("assert");

var {
  appendNewlines,
  generateDocblock,
  generateLineCommentBlock,
  getDocblock,
  getDocblockText,
  getEolCharacter,
  mergeDocblocks,
} = require("../../lib/utils");

describe("utils", function () {
  it("merges docblocks", function () {
    var block1 = `/**${EOL} * block 1${EOL} */`;
    var block2 = `/**${EOL} * block 2${EOL} */`;
    var block3 = `/**${EOL} * block 3${EOL} * has 2 lines${EOL} */`;

    var expectedBlock = `/**${EOL} * block 1${EOL} *${EOL} * block 2${EOL} *${EOL} * block 3${EOL} * has 2 lines${EOL} */`;
    var actualBlock = mergeDocblocks(EOL, block1, block2, block3);
    assert.equal(actualBlock, expectedBlock);
  });

  it("extracts docblocks from a string", function () {
    var block1 = `/**${EOL} * block 1${EOL} */`;
    var [actualBlock1, actualBlock1End] = getDocblock(block1, EOL);

    assert.equal(actualBlock1, block1);
    assert.equal(actualBlock1End, block1.length);
  });

  it("extracts docblocks from a string containing multiple docblocks", function () {
    var block1 = `/**${EOL} * block 1${EOL} */`;
    var block2 = `/**${EOL} * block 2${EOL} */`;

    var multiblock = `${block1}${EOL}${EOL}${block2}`;

    var [actualBlock1, actualBlock1End] = getDocblock(multiblock);
    var [actualBlock2, actualBlock2End] = getDocblock(
      multiblock,
      actualBlock1End,
    );

    assert.equal(actualBlock1, block1);
    assert.equal(actualBlock1End, block1.length);
    assert.equal(actualBlock2, block2);
    assert.equal(actualBlock2End, multiblock.length);
  });

  it("extracts text from a docblock correctly", function () {
    var block = `/**${EOL} * This is a comment${EOL} * that has multiple lines.${EOL} *${EOL} * @jest-environment jsdom${EOL} */`;

    var expectedText = `This is a comment${EOL}that has multiple lines.${EOL}${EOL}@jest-environment jsdom`;
    var actualText = getDocblockText(block, EOL);

    assert.equal(actualText, expectedText);
  });

  it("correctly generates a docblock from a header string", function () {
    var s = "This is a header string.";

    var expectedBlock = `/**${EOL} * ${s}${EOL} */`;

    var actualBlock = generateDocblock(s, EOL);
    assert.equal(actualBlock, expectedBlock);
  });

  it("correctly generates a line comment block from a string", function () {
    var s = "This is a header string\nwith multiple lines";

    var expectedText = "// This is a header string\n// with multiple lines";

    assert.equal(generateLineCommentBlock(s, "\n"), expectedText);
  });

  it("correctly formats text with newlines", function () {
    var block = `/**${EOL} * This is a comment.${EOL} */`;
    var expectedBlock = `${block}${EOL}`;

    var actualBlock = appendNewlines(block, EOL, 1);

    assert.equal(actualBlock, expectedBlock);
  });

  it("gets the correct End of Line character", function () {
    assert.equal(getEolCharacter("This is some code\n"), "\n");
    assert.equal(
      getEolCharacter("This is some code.\r\nAnd some more code."),
      "\r\n",
    );
    assert.equal(getEolCharacter("This is some code.\u2028"), "\u2028");
  });
});
