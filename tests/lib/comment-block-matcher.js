"use strict";

const assert = require("assert");

const CommentBlockMatcher = require("../../lib/comment-block-matcher");

describe("CommentBlockMatcher", () => {
  it("Correctly matches a starting pattern in a list of tokens", () => {
    // Arrange
    const prefix = "prefix";
    const tokens = [{ value: `${prefix}Line1` }, { value: "Line2" }];
    const matcher = new CommentBlockMatcher();

    // Act
    const result = matcher.tokensStartWith(tokens, prefix);

    // Assert
    assert(result.matches);
    assert.equal(result.tokenIndex, 0);
    assert.equal(result.tokenCharacterIndex, prefix.length);
  });

  it("Correctly matches an ending pattern in a list of tokens", () => {
    // Arrange
    const suffix = "suffix";
    const tokens = [{ value: "Line1" }, { value: `Line2${suffix}` }];
    const matcher = new CommentBlockMatcher();

    // Act
    const result = matcher.tokensEndWith(tokens, suffix);

    // Assert
    assert(result.matches);
    assert.equal(result.tokenIndex, tokens.length - 1);
    assert.equal(
      result.tokenCharacterIndex,
      tokens[tokens.length - 1].value.length - suffix.length,
    );
  });

  it("Correctly matches a JSDoc comment block", () => {
    // Arrange
    const config = {
      blockPrefix: "*\n",
      blockSuffix: "\n ",
      linePrefix: " * ",
      style: "jsdoc",
      eol: "\n",
    };
    const expectedLines = ["Line1", "Line2"];
    const bodyText = expectedLines
      .map((line) => `${config.linePrefix}${line}`)
      .join(config.eol);
    const tokens = [
      {
        value: `${config.blockPrefix}${bodyText}${config.blockSuffix}`,
      },
    ];

    // Act
    const result = new CommentBlockMatcher({ ...config, expectedLines }).match(
      tokens,
    );

    // Assert
    assert(result);
  });

  it("Correctly matches a line comment block", () => {
    // Arrange
    const config = {
      linePrefix: " ",
      style: "line",
      eol: "\n",
    };
    const expectedLines = ["This is the expected line 1.", "This is line 2."];
    const tokens = expectedLines.map((line) => ({
      value: `${config.linePrefix}${line}`,
    }));

    // Act
    const result = new CommentBlockMatcher(config).match(tokens);

    // Assert
    assert(result);
  });

  it("Correctly fails a mismatched suffix", () => {
    // Arrange
    const config = {
      blockPrefix: "*\n",
      blockSuffix: "\nblockSuffix",
      linePrefix: " * ",
      style: "jsdoc",
      eol: "\n",
    };
    const expectedLines = ["Line1", "Line2"];
    const bodyText = expectedLines
      .map((line) => `${config.linePrefix}${line}`)
      .join(config.eol);
    const tokens = [
      {
        value: `${config.blockPrefix}${bodyText}`,
      },
    ];

    // Act
    const result = new CommentBlockMatcher({ ...config, expectedLines }).match(
      tokens,
    );

    // Assert
    assert(!result);
  });

  it("Correctly fails a mismatched body", () => {
    // Arrange
    const config = {
      blockPrefix: "*\n",
      blockSuffix: "\n ",
      linePrefix: " * ",
      style: "jsdoc",
      eol: "\n",
    };
    const expectedLines = ["This is the expected header comment."];
    const bodyText = `${config.linePrefix}This is the wrong header comment.`;
    const tokens = [
      {
        value: `${config.blockPrefix}${bodyText}${config.blockSuffix}`,
      },
    ];

    // Act
    const result = new CommentBlockMatcher({ ...config, expectedLines }).match(
      tokens,
    );

    // Assert
    assert(!result);
  });

  it("Correctly fails a partial content match", () => {
    // Arrange
    const config = {
      linePrefix: " ",
      style: "line",
      eol: "\n",
      expectedLines: ["This is a", "split comment"],
    };
    const tokens = [{ value: " This is a" }];

    // Act
    const result = new CommentBlockMatcher(config).match(tokens);

    // Assert
    assert(!result);
  });

  it("Correctly matches content with mixed line endings", () => {
    // Arrange
    const testLines = ["This is line one", "This is line two"];
    const config = {
      blockPrefix: "*\n",
      blockSuffix: "\n ",
      linePrefix: " * ",
      style: "jsdoc",
      expectedLines: testLines,
    };
    const tokens = [
      { value: "*\r\n * This is line one\r\n * This is line two\r\n " },
    ];

    // Act
    const result = new CommentBlockMatcher(config).match(tokens);

    // Assert
    assert(result);
  });
});
