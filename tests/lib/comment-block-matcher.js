"use strict";

const assert = require("assert");

const CommentBlockMatcher = require("../../lib/comment-block-matcher");

describe("CommentBlockMatcher", () => {
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
    assert(!!result);
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
    assert(!!result);
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

  it("Correctly matches configured patterns", () => {
    // Arrange
    const testPattern1Name = "testPattern";
    const testPattern2Name = "otherPattern";
    const testPattern1 = "\\d{4}";
    const testPattern2 = "\\w+";
    const expectedPattern1Value = "2014";
    const expectedPattern2Value = "testWord";
    const expectedContent = `Copyright (${testPattern1Name}). All rights reserved. (${testPattern2Name}). (bad)`;
    const commentString = `Copyright ${expectedPattern1Value}. All rights reserved. ${expectedPattern2Value}. (bad)`;
    const matcher = new CommentBlockMatcher({
      blockPrefix: "",
      blockSuffix: "",
      linePrefix: "",
      eol: "\n",
      expectedLines: [expectedContent],
      patterns: {
        [testPattern1Name]: { pattern: testPattern1 },
        [testPattern2Name]: { pattern: testPattern2 },
      },
    });

    // Act
    const result = matcher.match([{ value: commentString }]);

    // Assert
    assert(result);
  });

  it("Correctly identifies mismatched patterns", () => {
    // Arrange
    const testPattern1Name = "testPattern";
    const testPattern2Name = "otherPattern";
    const testPattern1 = "\\d{4}";
    const testPattern2 = "\\w+";
    const expectedPattern1Value = "invalid";
    const expectedPattern2Value = "testWord";
    const expectedContent = `Copyright (${testPattern1Name}). All rights reserved. (${testPattern2Name}). (bad)`;
    const commentString = `Copyright ${expectedPattern1Value}. All rights reserved. ${expectedPattern2Value}. (bad)`;
    const patterns = {
      [testPattern1Name]: { pattern: testPattern1 },
      [testPattern2Name]: { pattern: testPattern2 },
    };
    const matcher = new CommentBlockMatcher({
      blockPrefix: "",
      blockSuffix: "",
      linePrefix: "",
      eol: "\n",
      expectedLines: [expectedContent],
      patterns,
    });

    // Act
    const result = matcher.match([{ value: commentString }]);

    // Assert
    assert(!result);
  });

  it("Escapes input strings correctly", () => {
    // Arrange
    const expectedContent = `.`;
    const testInvalidActualContent = `f`;
    const matcher = new CommentBlockMatcher({
      blockPrefix: "",
      blockSuffix: "",
      linePrefix: "",
      eol: "\n",
      expectedLines: [expectedContent],
    });

    // Act
    const result = matcher.match([{ value: testInvalidActualContent }]);

    // Assert
    assert(!result);
  });
});
