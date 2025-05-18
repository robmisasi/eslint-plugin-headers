/**
 * @fileoverview Class for validating comment blocks for proper content and format.
 * @author Rob Misasi
 */
"use strict";

const {
  escapeCharactersForRegex,
  getPatternLocations,
  normalizeComments,
  normalizeEol,
} = require("./utils");

const ContentMismatch = { type: "content" };

/**
 * The comment block matcher.
 */
class CommentBlockMatcher {
  /**
   * @typedef {("pattern" | "content")} MismatchType
   *
   * @typedef MismatchInfo
   * @type {object}
   * @property {[number, number]} range The location of the mismatch.
   * @property {MismatchType} type The type of mismatch.
   *
   * @typedef MatchInfo The information of a match operation.
   * @type {object}
   * @property {boolean} matches A value indicating whether the match is successful.
   * @property {number} tokenIndex The index of the token to parse.
   * @property {number} tokenCharacterIndex The index of the character within a token to parse.
   * @property {MismatchInfo[]=} mismatches The information about the mismatches, if appropriate.
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

    // Populated with the parsed values or null (if value is invalid) for each pattern in the order it appears.
    this.patternValues = {};
    Object.keys(patterns ?? {}).forEach((patternName) => {
      this.patternValues[patternName] = [];
    });
  }

  /**
   * Verifies {@link comments} matches the configuration.
   *
   * @param {import('@types/estree').Comment[]} comments The AST nodes to verify.
   * @returns {{ mismatches: MismatchInfo | undefined; patterValues: Object.<string, string[]>}} The results of the match operation.
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

    /** @type {MatchInfo} */
    let bodyMatchInfo = {
      matches: true,
      tokenIndex: prefixMatchInfo.tokenIndex,
      tokenCharacterIndex: prefixMatchInfo.tokenCharacterIndex,
    };

    for (let lineIndex = 0; lineIndex < expectedLines.length; lineIndex += 1) {
      const newBodyMatchInfo = this.tokensStartWith(
        normalizedComments,
        expectedLines[lineIndex],
        bodyMatchInfo.tokenIndex,
        bodyMatchInfo.tokenCharacterIndex,
      );

      bodyMatchInfo.tokenIndex = newBodyMatchInfo.tokenIndex;
      bodyMatchInfo.tokenCharacterIndex = newBodyMatchInfo.tokenCharacterIndex;
      if (newBodyMatchInfo.mismatches) {
        bodyMatchInfo.mismatches = bodyMatchInfo.mismatches
          ? bodyMatchInfo.mismatches.concat(...newBodyMatchInfo.mismatches)
          : [...newBodyMatchInfo.mismatches];
      }

      if (bodyMatchInfo.mismatches) {
        bodyMatchInfo.matches = false;
        break;
      }
    }

    return {
      mismatches:
        bodyMatchInfo.mismatches ||
        prefixMatchInfo.mismatches ||
        suffixMatchInfo.mismatches ||
        undefined,
      patternValues: this.patternValues,
    };
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
    /** @type {MatchInfo} */
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
        const mismatches = this.matchStrings(segment, tokenSubstring);
        resultInfo.matches &= mismatches === undefined;
        resultInfo.mismatches = mismatches;
        characterIndex += currentTokenLength;
      } else {
        const segment = expectedStartingString.substring(characterIndex);
        const currentTokenSubstring = currentToken.substring(
          resultInfo.tokenCharacterIndex,
        );
        const mismatches = this.matchStringStart(
          segment,
          currentTokenSubstring,
        );
        resultInfo.matches &= mismatches === undefined;
        resultInfo.mismatches = mismatches;
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
      resultInfo.mismatches = resultInfo.mismatches ?? [ContentMismatch];
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
    /** @type {MatchInfo} */
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
        const mismatches = this.matchStrings(segment, currentToken);
        resultInfo.matches &= mismatches === undefined;
        resultInfo.mismatches = mismatches;
        characterIndex -= currentTokenLength;
      } else {
        const segment = expectedEndingString.substring(0, characterIndex);
        const mismatches = this.matchStringEnd(segment, currentToken);
        resultInfo.matches &= mismatches === undefined;
        resultInfo.mismatches = mismatches;
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
   * @returns {MismatchInfo[] | undefined} The list of mismatches, if present.
   */
  matchStrings(expectedString, actualString) {
    const matches = getPatternLocations(expectedString, this.patterns);
    if (matches.length === 0) {
      return expectedString === actualString ? undefined : [ContentMismatch];
    }

    const patternMismatches = this.verifyPatternValues(
      expectedString,
      actualString,
      matches,
    );
    if (patternMismatches) {
      return patternMismatches;
    }

    const expectedStringWithPatterns = this.getEscapedPatternString(
      expectedString,
      matches,
    );
    const expectedStringRegex = new RegExp(`^${expectedStringWithPatterns}$`);
    const actualMatch = expectedStringRegex.exec(actualString);
    return actualMatch === null ? [ContentMismatch] : undefined;
  }

  /**
   * Verifies that {@link actualString} starts with the content described in
   * {@link expectedString}.
   *
   * @param {string} expectedString The expected string.
   * @param {string} actualString The actual string.
   * @returns {MismatchInfo[] | undefined} The mismatch info, if available.
   */
  matchStringStart(expectedString, actualString) {
    const matches = getPatternLocations(expectedString, this.patterns);
    if (matches.length === 0) {
      return actualString.startsWith(expectedString)
        ? undefined
        : [ContentMismatch];
    }

    const patternMismatches = this.verifyPatternValues(
      expectedString,
      actualString,
      matches,
    );
    if (patternMismatches) {
      return patternMismatches;
    }

    const expectedStringWithPatterns = this.getEscapedPatternString(
      expectedString,
      matches,
    );
    const expectedStringRegex = new RegExp(`^${expectedStringWithPatterns}`);
    const actualMatch = expectedStringRegex.exec(actualString);
    return actualMatch === null ? [ContentMismatch] : undefined;
  }

  /**
   * Verifies that {@link actualString} ends with the content described in
   * {@link expectedString}.
   *
   * @param {string} expectedString The expected string.
   * @param {string} actualString The actual string.
   * @returns {MismatchInfo[] | undefined} The mismatch info, if any.
   */
  matchStringEnd(expectedString, actualString) {
    const matches = getPatternLocations(expectedString, this.patterns);
    if (matches.length === 0) {
      return actualString.endsWith(expectedString)
        ? undefined
        : [ContentMismatch];
    }

    const patternMismatches = this.verifyPatternValues(
      expectedString,
      actualString,
      matches,
    );
    if (patternMismatches) {
      return patternMismatches;
    }

    const expectedStringWithPatterns = this.getEscapedPatternString(
      expectedString,
      matches,
    );
    const expectedStringRegex = new RegExp(`${expectedStringWithPatterns}$`);
    const actualMatch = expectedStringRegex.exec(actualString);
    return actualMatch === null ? [ContentMismatch] : undefined;
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
   * Verifies that values provided for patterns are correctly match.
   *
   * @param {string} expectedString The expected content string.
   * @param {string} actualString The string to validate.
   * @param {RegExpExecArray[]} matches The locations of the configured patterns.
   * @returns {MismatchInfo[] | undefined} The mismatch information, if any.
   */
  verifyPatternValues(expectedString, actualString, matches) {
    if (!matches) {
      return undefined;
    }

    const characterValidationString = this.getCharacterValidationString(
      expectedString,
      matches,
    );
    const validationRegex = new RegExp(characterValidationString, "g");
    const patternValueMatches = validationRegex.exec(actualString);
    /** @type {MismatchInfo[]} */
    const mismatches = [];
    matches.forEach((match) => {
      const patternName = match[1];
      const pattern = this.patterns[patternName].pattern;
      const patternRegex = new RegExp(pattern);
      const patternValue = patternValueMatches.groups[patternName];
      const patternMatch = patternRegex.exec(patternValue);
      if (!patternMatch) {
        mismatches.push({
          type: "pattern",
          value: patternValue,
          range: [match.index, match.index + match[0].length],
        });
        this.patternValues[patternName].push(null);
      } else {
        this.patternValues[patternName].push(patternValue);
      }
    });

    return mismatches.length > 0 ? mismatches : undefined;
  }

  /**
   * Gets a character validation string to identify configured patterns that are
   * incorrectly matched.
   *
   * @param {string} string The expected content string.
   * @param {RegExpExecArray[]} matches The locations of configured patterns.
   * @returns {string} The character validation string.
   */
  getCharacterValidationString(string, matches) {
    const stringSegments = [];
    let parseIndex = 0;
    matches.forEach((match) => {
      const patternName = match[1];
      const nextLiteralSegment = string.substring(parseIndex, match.index);
      stringSegments.push(escapeCharactersForRegex(nextLiteralSegment));
      stringSegments.push(`(?<${patternName}>.*)`);
      parseIndex = match.index + match[0].length;
    });

    const lastLiteralSegment = escapeCharactersForRegex(
      string.substring(parseIndex),
    );
    stringSegments.push(lastLiteralSegment);
    const expectedStringWithPatterns = stringSegments.join("");
    return expectedStringWithPatterns;
  }
}

module.exports = CommentBlockMatcher;
