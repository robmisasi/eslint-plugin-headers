"use strict";

var { EOL } = require("os");
var assert = require("assert");

var {
  formatExpectedHeader,
  generateDocblock,
  getDocblock,
  getDocblockText,
  mergeDocblocks,
} = require("../../lib/utils");

describe("utils", function () {
  it("merges docblocks", function () {
    var block1 = `/**${EOL} * block 1${EOL} */`;
    var block2 = `/**${EOL} * block 2${EOL} */`;
    var block3 = `/**${EOL} * block 3${EOL} * has 2 lines${EOL} */`;

    var expectedBlock = `/**${EOL} * block 1${EOL} *${EOL} * block 2${EOL} *${EOL} * block 3${EOL} * has 2 lines${EOL} */`;
    var actualBlock = mergeDocblocks(block1, block2, block3);
    assert.equal(actualBlock, expectedBlock);
  });

  it("extracts docblocks from a string", function () {
    var block1 = `/**${EOL} * block 1${EOL} */`;
    var [actualBlock1, actualBlock1End] = getDocblock(block1);

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
      actualBlock1End
    );

    assert.equal(actualBlock1, block1);
    assert.equal(actualBlock1End, block1.length);
    assert.equal(actualBlock2, block2);
    assert.equal(actualBlock2End, multiblock.length);
  });

  it("extracts text from a docblock correctly", function () {
    var block = `/**${EOL} * This is a comment${EOL} * that has multiple lines.${EOL} *${EOL} * @jest-environment jsdom${EOL} */`;

    var expectedText = `This is a comment${EOL}that has multiple lines.${EOL}${EOL}@jest-environment jsdom`;
    var actualText = getDocblockText(block);

    assert.equal(actualText, expectedText);
  });

  it("correctly generates a docblock from a header string", function () {
    var s = "This is a header string.";

    var expectedBlock = `/**${EOL} * ${s}${EOL} */`;

    var actualBlock = generateDocblock(s);
    assert.equal(actualBlock, expectedBlock);
  });

  it("correctly formats a docblock with newlines", function () {
    var block = `/**${EOL} * This is a comment.${EOL} */`;
    var expectedBlock = `${block}${EOL}`;

    var actualBlock = formatExpectedHeader(block, 1);

    assert.equal(actualBlock, expectedBlock);
  });
});
