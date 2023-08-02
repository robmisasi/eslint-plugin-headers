"use strict";

const assert = require("assert");

const CommentParser = require("../../lib/comment-parser");

describe("CommentParser", () => {
  it("Correctly parses a comment", () => {
    const comment = "Line1\nLine2";

    const actualComment = new CommentParser().parse(comment);
    assert.deepEqual(actualComment, ["Line1", "Line2"]);
  });

  it("Correctly parses a comment with a line prefix", () => {
    const comment = "prefixLine1\nprefixLine2";

    const actualComment = new CommentParser({ linePrefix: "prefix" }).parse(
      comment,
    );
    assert.deepEqual(actualComment, ["Line1", "Line2"]);
  });

  it("Correctly parses a comment with a block prefix", () => {
    const comment = "blockPrefixLine1\nLine2";

    const actualComment = new CommentParser({
      blockPrefix: "blockPrefix",
    }).parse(comment);
    assert.deepEqual(actualComment, ["Line1", "Line2"]);
  });

  it("Correctly parses a comment with a block suffix", () => {
    const comment = "Line1\nLine2blockSuffix";

    const actualComment = new CommentParser({
      blockSuffix: "blockSuffix",
    }).parse(comment);
    assert.deepEqual(actualComment, ["Line1", "Line2"]);
  });
});
