"use strict";

const assert = require("assert");

const CommentFormatter = require("../../lib/comment-formatter");

describe("CommentFormatter", () => {
  it("Formats a default block comment correctly", () => {
    const lines = ["Line1", "Line2"];

    const expectedString = "/**\n * Line1\n * Line2\n */";
    const actualString = new CommentFormatter(lines, { eol: "\n" }).format(
      "jsdoc",
    );

    assert.equal(actualString, expectedString);
  });

  it("Formats a default line comment correctly", () => {
    const lines = ["Line1", "Line2"];

    const expectedString = "// Line1\n// Line2";
    const actualString = new CommentFormatter(lines, { eol: "\n" }).format(
      "line",
    );

    assert.equal(actualString, expectedString);
  });

  it("Formats a block suffix correctly", () => {
    const lines = ["Line1", "Line2"];
    const blockSuffix = "blockSuffix";
    const formatter = new CommentFormatter(lines, {
      blockSuffix: blockSuffix,
      eol: "\n",
    });

    const expectedBlockString = "/**\n * Line1\n * Line2blockSuffix*/";
    const expectedLineString = "// Line1\n// Line2\n//blockSuffix";
    const actualBlockString = formatter.format("jsdoc");
    const actualLineString = formatter.format("line");

    assert.equal(actualBlockString, expectedBlockString);
    assert.equal(actualLineString, expectedLineString);
  });

  it("Formats a block prefix correctly", () => {
    const lines = ["Line1", "Line2"];
    const blockPrefix = "blockPrefix";
    const formatter = new CommentFormatter(lines, {
      blockPrefix: blockPrefix,
      eol: "\n",
    });

    const expectedBlockString = "/*blockPrefix * Line1\n * Line2\n */";
    const expectedLineString = "//blockPrefix\n// Line1\n// Line2";
    const actualBlockString = formatter.format("jsdoc");
    const actualLineString = formatter.format("line");

    assert.equal(actualBlockString, expectedBlockString);
    assert.equal(actualLineString, expectedLineString);
  });

  it("Formats a line prefix correctly", () => {
    const lines = ["Line1", "Line2"];
    const linePrefix = "linePrefix";
    const formatter = new CommentFormatter(lines, {
      linePrefix: linePrefix,
      eol: "\n",
    });

    const expectedBlockString = "/**\nlinePrefixLine1\nlinePrefixLine2\n */";
    const expectedLineString = "//linePrefixLine1\n//linePrefixLine2";
    const actualBlockString = formatter.format("jsdoc");
    const actualLineString = formatter.format("line");

    assert.equal(actualBlockString, expectedBlockString);
    assert.equal(actualLineString, expectedLineString);
  });
});
