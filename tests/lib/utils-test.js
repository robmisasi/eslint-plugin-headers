"use strict";

const assert = require("assert");

const { appendNewlines, getEolCharacter } = require("../../lib/utils");

describe("utils", () => {
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
