/**
 * @fileoverview Class for validating comment blocks for proper content and format.
 * @author Rob Misasi
 */
"use strict";

const {
  normalizeComments,
  normalizeEol,
  escapeCharactersForRegex,
} = require("./utils");

/**
 * The comment block matcher.
 */
class CommentBlockMatcher {
  /**
   * @typedef MatchInfo The information of a match operation.
   * @type {object}
   * @property {boolean} matches A value indicating whether the match is successful.
   * @property {number} tokenIndex The index of the token to parse.
   * @property {number} tokenCharacterIndex The index of the character within a token to parse.
   *
   * @typedef PatternInfo The pattern info.
   * @type {object}
   * @property {string} pattern The pattern to match.
   *
   * @typedef PatternMap The map of names to pattern infos.
   * @type {Object.<string, PatternInfo>}
   */

  /**
   * @param {{
   *   blockPrefix?: string;
   *   blockSuffix?: string;
   *   linePrefix?:string;
   *   style: "line" | "jsdoc" | "html";
   *   expectedLines?: string[];
   *   patterns?: PatternMap
   * }} config Configuration to match against
   */
  constructor({
    blockPrefix,
    blockSuffix,
    linePrefix,
    style,
    expectedLines,
    patterns,
  } = {}) {
    this.blockPrefix = blockPrefix ? normalizeEol(blockPrefix) : "";
    this.blockSuffix = blockSuffix ? normalizeEol(blockSuffix) : "";
    this.linePrefix = linePrefix ? normalizeEol(linePrefix) : "";
    this.style = style;
    this.expectedLines = expectedLines ?? [];
    this.patterns = patterns;
  }

  /**
   * Verifies {@link comments} matches the configuration.
   *
   * @param {import('@types/estree').Comment[]} comments The AST nodes to verify.
   * @returns {boolean} A flag indicating whether {@link comments} matches the configuration.
   */
  match(comments) {
    const normalizedComments = normalizeComments(comments);
    const prefixMatchInfo = this.tokensStartWith(
      normalizedComments,
      this.blockPrefix,
    );
    const suffixMatchInfo = this.tokensEndWith(
      normalizedComments,
      this.blockSuffix,
    );

    let expectedLines = this.expectedLines.map((line) =>
      `${this.linePrefix}${line}`.trimEnd(),
    );
    if (this.style !== "line") {
      expectedLines = [expectedLines.join("\n")];
    }

    let bodyMatchInfo = {
      matches: true,
      tokenIndex: prefixMatchInfo.tokenIndex,
      tokenCharacterIndex: prefixMatchInfo.tokenCharacterIndex,
    };
    const bodyMatch = expectedLines.every((line) => {
      bodyMatchInfo = this.tokensStartWith(
        normalizedComments,
        line,
        bodyMatchInfo.tokenIndex,
        bodyMatchInfo.tokenCharacterIndex,
      );
      return bodyMatchInfo.matches;
    });

    return bodyMatch && prefixMatchInfo.matches && suffixMatchInfo.matches;
  }

  /**
   * Verifies the Comment AST nodes in the array {@link tokens} start with {@link expectedStartingString}.
   *
   * @param {import('@types/estree').Comment[]} tokens
   * @param {string} expectedStartingString The string to match against.
   * @returns {MatchInfo} The information of the match operation.
   */
  tokensStartWith(
    tokens,
    expectedStartingString,
    tokenIndex = 0,
    tokenCharacterIndex = 0,
  ) {
    let resultInfo = {
      matches: true,
      tokenIndex,
      tokenCharacterIndex,
    };
    if (expectedStartingString.length === 0) {
      return resultInfo;
    }

    let characterIndex = 0;
    while (
      resultInfo.tokenIndex < tokens.length &&
      characterIndex < expectedStartingString.length
    ) {
      const remainingCharacterCount =
        expectedStartingString.length - characterIndex;
      const currentToken = tokens[resultInfo.tokenIndex].value;
      const currentTokenLength = currentToken.length;
      if (
        remainingCharacterCount >
        currentTokenLength - resultInfo.tokenCharacterIndex
      ) {
        const segment = expectedStartingString.substring(
          characterIndex,
          characterIndex + currentTokenLength,
        );
        const tokenSubstring = currentToken.substring(
          resultInfo.tokenCharacterIndex,
        );
        resultInfo.matches &= this.matchStrings(segment, tokenSubstring);
        characterIndex += currentTokenLength;
      } else {
        const segment = expectedStartingString.substring(characterIndex);
        const currentTokenSubstring = currentToken.substring(
          resultInfo.tokenCharacterIndex,
        );
        resultInfo.matches &= this.matchStringStart(
          segment,
          currentTokenSubstring,
        );
        resultInfo.tokenCharacterIndex = remainingCharacterCount;
        characterIndex += segment.length;
      }

      if (resultInfo.tokenCharacterIndex === currentTokenLength) {
        resultInfo.tokenIndex += 1;
        resultInfo.tokenCharacterIndex = 0;
      }

      if (!resultInfo.matches) {
        break;
      }
    }

    // If characterIndex was not incremented to string length, then
    // pattern is longer than tokens supplied and match is impossible.
    if (characterIndex !== expectedStartingString.length) {
      resultInfo.matches = false;
    }

    return resultInfo;
  }

  /**
   * Verifies {@link tokens} end with {@link expectedEndingString}.
   *
   * @param {import('@types/estree').Comment[]} tokens
   * @param {string} expectedEndingString
   * @returns {MatchInfo} The information of the match operation.
   */
  tokensEndWith(tokens, expectedEndingString) {
    let resultInfo = {
      matches: true,
      tokenIndex: tokens.length - 1,
      tokenCharacterIndex: tokens[tokens.length - 1].value.length,
    };
    if (expectedEndingString.length === 0) {
      return resultInfo;
    }

    let characterIndex = expectedEndingString.length;
    while (resultInfo.tokenIndex >= 0 && characterIndex > 0) {
      const currentToken = tokens[resultInfo.tokenIndex].value;
      const currentTokenLength = currentToken.length;
      if (characterIndex > currentTokenLength) {
        const segment = expectedEndingString.substring(
          characterIndex - currentTokenLength,
          characterIndex,
        );
        resultInfo.matches &= this.matchStrings(segment, currentToken);
        characterIndex -= currentTokenLength;
      } else {
        const segment = expectedEndingString.substring(0, characterIndex);
        resultInfo.matches &= this.matchStringEng(segment, currentToken);
        resultInfo.tokenCharacterIndex = currentTokenLength - segment.length;
        characterIndex -= segment.length;
      }
      if (resultInfo.tokenCharacterIndex === 0) {
        resultInfo.tokenIndex -= 1;
        resultInfo.tokenCharacterIndex = currentTokenLength;
      }

      if (!resultInfo.matches) {
        break;
      }
    }

    // If characterIndex was not decremented to 0, a match was not found.
    if (characterIndex !== 0) {
      resultInfo.matches = false;
    }

    return resultInfo;
  }

  /**
   * Verifies that {@link actualString} matches {@link expectedString}.
   *
   * @param {string} expectedString The expected string segment.
   * @param {string} actualString The actual string segment.
   * @returns {boolean} A value indicating whether the provided strings match.
   */
  matchStrings(expectedString, actualString) {
    const matches = this.getPatterns(expectedString);
    if (matches.length === 0) {
      return expectedString === actualString;
    }

    const expectedStringWithPatterns = this.getEscapedPatternString(
      expectedString,
      matches,
    );
    const expectedStringRegex = new RegExp(`^${expectedStringWithPatterns}$`);
    const actualMatch = expectedStringRegex.exec(actualString);
    return actualMatch !== null;
  }

  /**
   * Verifies that {@link actualString} starts with the content described in
   * {@link expectedString}.
   *
   * @param {string} expectedString The expected string.
   * @param {string} actualString The actual string.
   * @returns {boolean} A value indicating whether the provided strings match.
   */
  matchStringStart(expectedString, actualString) {
    const matches = this.getPatterns(expectedString);
    if (matches.length === 0) {
      return actualString.startsWith(expectedString);
    }

    const expectedStringWithPatterns = this.getEscapedPatternString(
      expectedString,
      matches,
    );
    const expectedStringRegex = new RegExp(`^${expectedStringWithPatterns}`);
    const actualMatch = expectedStringRegex.exec(actualString);
    return actualMatch !== null;
  }

  /**
   * Verifies that {@link actualString} ends with the content described in
   * {@link expectedString}.
   *
   * @param {string} expectedString The expected string.
   * @param {string} actualString The actual string.
   * @returns {boolean} A value indicating whether the provided strings match.
   */
  matchStringEng(expectedString, actualString) {
    const matches = this.getPatterns(expectedString);
    if (matches.length === 0) {
      return actualString.endsWith(expectedString);
    }

    const expectedStringWithPatterns = this.getEscapedPatternString(
      expectedString,
      matches,
    );
    const expectedStringRegex = new RegExp(`${expectedStringWithPatterns}$`);
    const actualMatch = expectedStringRegex.exec(actualString);
    return actualMatch !== null;
  }

  /**
   * Escapes and populates a string with the configured patterns for use in
   * regular expressions.
   *
   * @param {string} string The string to parse for pattern names.
   * @param {RegExpExecArray[]} matches The pattern string matches.
   * @returns {string} The regex string.
   */
  getEscapedPatternString(string, matches) {
    const stringSegments = [];
    let parseIndex = 0;
    matches.forEach((match) => {
      const patternName = match[1];
      const pattern = this.patterns[patternName].pattern;
      const nextLiteralSegment = string.substring(parseIndex, match.index);
      stringSegments.push(escapeCharactersForRegex(nextLiteralSegment));
      stringSegments.push(pattern);
      parseIndex = match.index + match[0].length;
    });

    const lastLiteralSegment = escapeCharactersForRegex(
      string.substring(parseIndex),
    );
    stringSegments.push(lastLiteralSegment);
    const expectedStringWithPatterns = stringSegments.join("");
    return expectedStringWithPatterns;
  }

  /**
   * Searches for configured patterns in a given string.
   *
   * @param {string} string The string to find patterns within.
   * @returns The match results.
   */
  getPatterns(string) {
    const patternRegex = /\((\w+)\)/g;
    const matches = [...string.matchAll(patternRegex)].filter(
      (matchResult) => !!this.patterns[matchResult[1]],
    );
    return matches;
  }

  getPatternIdentifier(patternName) {
    return `(${patternName})`;
  }
}

module.exports = CommentBlockMatcher;
