const { getEolCharacter } = require("./utils");

class CommentParser {
  constructor({ blockPrefix, blockSuffix, linePrefix } = {}) {
    this.blockPrefix = blockPrefix;
    this.blockSuffix = blockSuffix;
    this.linePrefix = linePrefix;
  }

  /**
   * @param {string} string Comment string to parse
   * @returns {string[]} array of strings representing comment content by line,
   *                     excluding line prefixes and block prefix/suffixes.
   */
  parse(string) {
    const eol = getEolCharacter(string);
    let stripped =
      this.blockPrefix && string.startsWith(this.blockPrefix)
        ? string.substring(this.blockPrefix.length)
        : string;

    stripped =
      this.blockSuffix && stripped.endsWith(this.blockSuffix)
        ? stripped.substring(0, stripped.length - this.blockSuffix.length)
        : stripped;
    return stripped
      .split(eol)
      .map((line) =>
        this.linePrefix && line.startsWith(this.linePrefix)
          ? line.replace(this.linePrefix, "")
          : line,
      );
  }
}

module.exports = CommentParser;
