"use strict";

const assert = require("assert");

const CommentBlockMatcher = require("../../lib/comment-block-matcher");

describe("CommentBlockMatcher", () => {
  it("Correctly matches a starting pattern in a list of tokens", () => {
    const prefix = "prefix";
    const tokens = [{ value: `${prefix}Line1` }, { value: "Line2" }];

    const matcher = new CommentBlockMatcher();
    const result = matcher.tokensStartWith(tokens, prefix);
    assert(result.matches);
    assert.equal(result.tokenIndex, 0);
    assert.equal(result.tokenCharacterIndex, prefix.length);
  });

  it("Correctly matches an ending pattern in a list of tokens", () => {
    const suffix = "suffix";
    const tokens = [{ value: "Line1" }, { value: `Line2${suffix}` }];

    const matcher = new CommentBlockMatcher();
    const result = matcher.tokensEndWith(tokens, suffix);

    assert(result.matches);
    assert.equal(result.tokenIndex, tokens.length - 1);
    assert.equal(
      result.tokenCharacterIndex,
      tokens[tokens.length - 1].value.length - suffix.length,
    );
  });

  it("Correctly matches a JSDoc comment block", () => {
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

    const result = new CommentBlockMatcher({ ...config, expectedLines }).match(
      tokens,
    );
    assert(result);
  });

  it("Correctly matches a line comment block", () => {
    const config = {
      linePrefix: " ",
      style: "line",
      eol: "\n",
    };

    const expectedLines = ["This is the expected line 1.", "This is line 2."];
    const tokens = expectedLines.map((line) => ({
      value: `${config.linePrefix}${line}`,
    }));

    const result = new CommentBlockMatcher(config).match(tokens);
    assert(result);
  });

  it("Correctly fails a mismatched suffix", () => {
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

    const result = new CommentBlockMatcher({ ...config, expectedLines }).match(
      tokens,
    );
    assert(!result);
  });

  it("Correctly fails a mismatched body", () => {
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

    const result = new CommentBlockMatcher({ ...config, expectedLines }).match(
      tokens,
    );
    assert(!result);
  });
});
