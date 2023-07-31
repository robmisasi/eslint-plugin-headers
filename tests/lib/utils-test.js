"use strict";

const { EOL } = require("os");
const assert = require("assert");

const {
  appendNewlines,
  generateDocblock,
  generateLineCommentBlock,
  getDocblock,
  getDocblockText,
  getEolCharacter,
  mergeDocblocks,
} = require("../../lib/utils");

describe("utils", () => {
  it("merges docblocks", () => {
    const block1 = `/**${EOL} * block 1${EOL} */`;
    const block2 = `/**${EOL} * block 2${EOL} */`;
    const block3 = `/**${EOL} * block 3${EOL} * has 2 lines${EOL} */`;

    const expectedBlock = `/**${EOL} * block 1${EOL} *${EOL} * block 2${EOL} *${EOL} * block 3${EOL} * has 2 lines${EOL} */`;
    const actualBlock = mergeDocblocks(EOL, block1, block2, block3);
    assert.equal(actualBlock, expectedBlock);
  });

  it("extracts docblocks from a string", () => {
    const block1 = `/**${EOL} * block 1${EOL} */`;
    const [actualBlock1, actualBlock1End] = getDocblock(block1, EOL);

    assert.equal(actualBlock1, block1);
    assert.equal(actualBlock1End, block1.length);
  });

  it("extracts docblocks from a string containing multiple docblocks", () => {
    const block1 = `/**${EOL} * block 1${EOL} */`;
    const block2 = `/**${EOL} * block 2${EOL} */`;

    const multiblock = `${block1}${EOL}${EOL}${block2}`;

    const [actualBlock1, actualBlock1End] = getDocblock(multiblock);
    const [actualBlock2, actualBlock2End] = getDocblock(
      multiblock,
      actualBlock1End,
    );

    assert.equal(actualBlock1, block1);
    assert.equal(actualBlock1End, block1.length);
    assert.equal(actualBlock2, block2);
    assert.equal(actualBlock2End, multiblock.length);
  });

  it("extracts text from a docblock correctly", () => {
    const block = `/**${EOL} * This is a comment${EOL} * that has multiple lines.${EOL} *${EOL} * @jest-environment jsdom${EOL} */`;

    const expectedText = `This is a comment${EOL}that has multiple lines.${EOL}${EOL}@jest-environment jsdom`;
    const actualText = getDocblockText(block, EOL);

    assert.equal(actualText, expectedText);
  });

  it("correctly generates a docblock from a header string", () => {
    const s = "This is a header string.";

    const expectedBlock = `/**${EOL} * ${s}${EOL} */`;

    const actualBlock = generateDocblock(s, EOL);
    assert.equal(actualBlock, expectedBlock);
  });

  it("correctly generates a line comment block from a string", () => {
    const s = "This is a header string\nwith multiple lines";

    const expectedText = "// This is a header string\n// with multiple lines";

    assert.equal(generateLineCommentBlock(s, "\n"), expectedText);
  });

  it("correctly formats text with newlines", () => {
    const block = `/**${EOL} * This is a comment.${EOL} */`;
    const expectedBlock = `${block}${EOL}`;

    const actualBlock = appendNewlines(block, EOL, 1);

    assert.equal(actualBlock, expectedBlock);
  });

  it("gets the correct End of Line character", () => {
    assert.equal(getEolCharacter("This is some code\n"), "\n");
    assert.equal(
      getEolCharacter("This is some code.\r\nAnd some more code."),
      "\r\n",
    );
    assert.equal(getEolCharacter("This is some code.\u2028"), "\u2028");
  });
});
