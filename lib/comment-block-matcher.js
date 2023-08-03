"use strict";

class CommentBlockMatcher {
  /**
   * @param {{
   *   blockPrefix?: string;
   *   blockSuffix?: string;
   *   linePrefix?:string;
   *   style: "line" | "jsdoc";
   *   eol: string;
   *   expectedLines?: string[];
   * }} config Configuration to match against
   */
  constructor({
    blockPrefix,
    blockSuffix,
    linePrefix,
    style,
    eol,
    expectedLines,
  } = {}) {
    this.blockPrefix = blockPrefix || "";
    this.blockSuffix = blockSuffix || "";
    this.linePrefix = linePrefix || "";
    this.eol = eol;
    this.style = style;
    this.expectedLines = expectedLines || [];
  }

  /**
   * @param {Comment[]} comments
   */
  match(comments) {
    const prefixMatchInfo = this.tokensStartWith(comments, this.blockPrefix);
    const suffixMatchInfo = this.tokensEndWith(comments, this.blockSuffix);

    let expectedLines = this.expectedLines.map(
      (line) => `${this.linePrefix}${line}`,
    );
    if (this.style === "jsdoc") {
      expectedLines = [expectedLines.join(this.eol)];
    }

    let resultInfo = {
      matches: true,
      tokenIndex: prefixMatchInfo.tokenIndex,
      tokenCharacterIndex: prefixMatchInfo.tokenCharacterIndex,
    };
    const bodyMatch = expectedLines.every((line) => {
      resultInfo = this.tokensStartWith(
        comments,
        line,
        resultInfo.tokenIndex,
        resultInfo.tokenCharacterIndex,
      );
      return resultInfo.matches;
    });

    return bodyMatch && prefixMatchInfo.matches && suffixMatchInfo.matches;
  }

  /**
   *
   * @param {Comment[]} tokens
   * @param {string} string to match against
   */
  tokensStartWith(tokens, string, tokenIndex = 0, tokenCharacterIndex = 0) {
    let resultInfo = {
      matches: true,
      tokenIndex,
      tokenCharacterIndex,
    };
    if (string.length === 0) {
      return resultInfo;
    }

    let characterIndex = 0;
    while (
      resultInfo.tokenIndex < tokens.length &&
      characterIndex < string.length
    ) {
      const remainingLength = string.length - characterIndex;
      if (
        remainingLength >
        tokens[resultInfo.tokenIndex].value.length -
          resultInfo.tokenCharacterIndex
      ) {
        const segment = string.substring(
          characterIndex,
          characterIndex + tokens[resultInfo.tokenIndex].value.length,
        );
        resultInfo.matches &=
          tokens[resultInfo.tokenIndex].value.substring(
            resultInfo.tokenCharacterIndex,
          ) === segment;
        characterIndex += tokens[resultInfo.tokenIndex].value.length;
      } else {
        const segment = string.substring(characterIndex);
        resultInfo.matches &= tokens[resultInfo.tokenIndex].value
          .substring(resultInfo.tokenCharacterIndex)
          .startsWith(segment);
        resultInfo.tokenCharacterIndex = remainingLength;
        characterIndex += segment.length;
      }

      if (
        resultInfo.tokenCharacterIndex ===
        tokens[resultInfo.tokenIndex].value.length
      ) {
        resultInfo.tokenIndex += 1;
        resultInfo.tokenCharacterIndex = 0;
      }

      if (!resultInfo.matches) {
        break;
      }
    }

    return resultInfo;
  }

  tokensEndWith(tokens, string) {
    let resultInfo = {
      matches: true,
      tokenIndex: tokens.length - 1,
      tokenCharacterIndex: tokens[tokens.length - 1].value.length,
    };
    if (string.length === 0) {
      return resultInfo;
    }

    let characterIndex = string.length;
    while (resultInfo.tokenIndex >= 0 && characterIndex > 0) {
      if (characterIndex > tokens[resultInfo.tokenIndex].value.length) {
        const segment = string.substring(
          characterIndex - tokens[resultInfo.tokenIndex].value.length,
          characterIndex,
        );
        resultInfo.matches &= tokens[resultInfo.tokenIndex].value === segment;
        characterIndex -= tokens[resultInfo.tokenIndex].value.length;
      } else {
        const segment = string.substring(0, characterIndex);
        resultInfo.matches &=
          tokens[resultInfo.tokenIndex].value.endsWith(segment);
        resultInfo.tokenCharacterIndex =
          tokens[resultInfo.tokenIndex].value.length - segment.length;
        characterIndex -= segment.length;
      }
      if (resultInfo.tokenCharacterIndex === 0) {
        resultInfo.tokenIndex -= 1;
        resultInfo.tokenCharacterIndex =
          tokens[resultInfo.tokenIndex].value.length;
      }

      if (!resultInfo.matches) {
        break;
      }
    }

    return resultInfo;
  }
}

module.exports = CommentBlockMatcher;
