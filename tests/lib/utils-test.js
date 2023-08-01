"use strict";

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
    const block1 = `/**\n * block 1\n */`;
    const block2 = `/**\n * block 2\n */`;
    const block3 = `/**\n * block 3\n * has 2 lines\n */`;

    const expectedBlock = `/**\n * block 1\n *\n * block 2\n *\n * block 3\n * has 2 lines\n */`;
    const actualBlock = mergeDocblocks("\n", block1, block2, block3);
    assert.equal(actualBlock, expectedBlock);
  });

  it("extracts docblocks from a string", () => {
    const block1 = `/**\n * block 1\n */`;
    const [actualBlock1, actualBlock1End] = getDocblock(block1, "\n");

    assert.equal(actualBlock1, block1);
    assert.equal(actualBlock1End, block1.length);
  });

  it("extracts docblocks from a string containing multiple docblocks", () => {
    const block1 = `/**\n * block 1\n */`;
    const block2 = `/**\n * block 2\n */`;

    const multiblock = `${block1}\n\n${block2}`;

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
    const block = `/**\n * This is a comment\n * that has multiple lines.\n *\n * @jest-environment jsdom\n */`;

    const expectedText = `This is a comment\nthat has multiple lines.\n\n@jest-environment jsdom`;
    const actualText = getDocblockText(block, "\n");

    assert.equal(actualText, expectedText);
  });

  it("correctly generates a docblock from a header string", () => {
    const s = "This is a header string.";

    const expectedBlock = `/**\n * ${s}\n */`;

    const actualBlock = generateDocblock(s, "\n");
    assert.equal(actualBlock, expectedBlock);
  });

  it("correctly generates a line comment block from a string", () => {
    const s = "This is a header string\nwith multiple lines";

    const expectedText = "// This is a header string\n// with multiple lines";

    assert.equal(generateLineCommentBlock(s, "\n"), expectedText);
  });

  it("correctly formats text with newlines", () => {
    const block = `/**\n * This is a comment.\n */`;
    const expectedBlock = `${block}\n`;

    const actualBlock = appendNewlines(block, "\n", 1);

    assert.equal(actualBlock, expectedBlock);
  });

  it("gets the correct End of Line character", () => {
    assert.equal(getEolCharacter("This is some code\n"), "\n");
    assert.equal(
      getEolCharacter("This is some code.\r\nAnd some more code."),
      "\r\n",
    );
  });
});
