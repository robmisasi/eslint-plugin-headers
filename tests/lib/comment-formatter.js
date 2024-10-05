"use strict";

const assert = require("assert");

const CommentFormatter = require("../../lib/comment-formatter");

describe("CommentFormatter", () => {
  it("Formats a default block comment correctly", () => {
    // Arrange
    const lines = ["Line1", "Line2"];
    const expectedString = "/**\n * Line1\n * Line2\n */";

    // Act
    const actualString = new CommentFormatter(lines, { eol: "\n" }).format(
      "jsdoc",
    );

    // Assert
    assert.equal(actualString, expectedString);
  });

  it("Formats a default line comment correctly", () => {
    // Arrange
    const lines = ["Line1", "Line2"];
    const expectedString = "// Line1\n// Line2";

    // Act
    const actualString = new CommentFormatter(lines, { eol: "\n" }).format(
      "line",
    );

    // Assert
    assert.equal(actualString, expectedString);
  });

  it("Formats a default HTML comment correctly", () => {
    // Arrange
    const lines = ["Line1", "Line2"];
    const expectedString = "<!--\n  Line1\n  Line2\n-->";

    // Act
    const actualString = new CommentFormatter(lines, { eol: "\n" }).format(
      "html",
    );

    // Assert
    assert.equal(actualString, expectedString);
  });

  it("Formats a block suffix correctly", () => {
    // Arrange
    const lines = ["Line1", "Line2"];
    const blockSuffix = "blockSuffix";
    const formatter = new CommentFormatter(lines, {
      blockSuffix: blockSuffix,
      eol: "\n",
    });
    const expectedBlockString = `/**\n * Line1\n * Line2${blockSuffix}*/`;
    const expectedLineString = `// Line1\n// Line2\n//${blockSuffix}`;
    const expectedHtmlString = `<!--\n  Line1\n  Line2${blockSuffix}-->`;

    // Act
    const actualBlockString = formatter.format("jsdoc");
    const actualLineString = formatter.format("line");
    const actualHtmlString = formatter.format("html");

    // Assert
    assert.equal(actualBlockString, expectedBlockString);
    assert.equal(actualLineString, expectedLineString);
    assert.equal(actualHtmlString, expectedHtmlString);
  });

  it("Formats a block prefix correctly", () => {
    // Arrange
    const lines = ["Line1", "Line2"];
    const blockPrefix = "blockPrefix";
    const formatter = new CommentFormatter(lines, {
      blockPrefix: blockPrefix,
      eol: "\n",
    });
    const expectedBlockString = `/*${blockPrefix} * Line1\n * Line2\n */`;
    const expectedLineString = `//${blockPrefix}\n// Line1\n// Line2`;
    const expectedHtmlString = `<!--${blockPrefix}  Line1\n  Line2\n-->`;

    // Act
    const actualBlockString = formatter.format("jsdoc");
    const actualLineString = formatter.format("line");
    const actualHtmlString = formatter.format("html");

    // Assert
    assert.equal(actualBlockString, expectedBlockString);
    assert.equal(actualLineString, expectedLineString);
    assert.equal(actualHtmlString, expectedHtmlString);
  });

  it("Formats a line prefix correctly", () => {
    // Arrange
    const lines = ["Line1", "Line2"];
    const linePrefix = "linePrefix";
    const formatter = new CommentFormatter(lines, {
      linePrefix: linePrefix,
      eol: "\n",
    });
    const expectedBlockString = `/**\n${linePrefix}Line1\n${linePrefix}Line2\n */`;
    const expectedLineString = `//${linePrefix}Line1\n//${linePrefix}Line2`;
    const expectedHtmlString = `<!--\n${linePrefix}Line1\n${linePrefix}Line2\n-->`;

    // Act
    const actualBlockString = formatter.format("jsdoc");
    const actualLineString = formatter.format("line");
    const actualHtmlString = formatter.format("html");

    // Assert
    assert.equal(actualBlockString, expectedBlockString);
    assert.equal(actualLineString, expectedLineString);
    assert.equal(actualHtmlString, expectedHtmlString);
  });
});
