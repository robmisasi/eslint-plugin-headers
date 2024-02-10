"use strict";

const assert = require("assert");

const {
  appendNewlines,
  getEolCharacter,
  normalizeComments,
} = require("../../lib/utils");

describe("utils", () => {
  it("Correctly formats text with newlines", () => {
    // Arrange
    const block = `/**\n * This is a comment.\n */`;
    const expectedBlock = `${block}\n`;

    // Act
    const actualBlock = appendNewlines(block, "\n", 1);

    // Assert
    assert.equal(actualBlock, expectedBlock);
  });

  it("Gets the correct End of Line character", () => {
    assert.equal(getEolCharacter("This is some code\n"), "\n");
    assert.equal(
      getEolCharacter("This is some code.\r\nAnd some more code."),
      "\r\n",
    );
  });

  it("Normalizes comments correctly", () => {
    // Arrange
    const testLines = ["testLine_1", "testLine_2"];
    const testNodes = [
      {
        value: `${testLines[0]}\n`,
      },
      {
        value: `${testLines[1]}\r\n`,
      },
    ];
    const expectedStrings = testLines.map((string) => ({
      value: `${string}\n`,
    }));

    // Act
    const actualStrings = normalizeComments(testNodes);

    // Assert
    assert.deepEqual(actualStrings, expectedStrings);
  });
});
