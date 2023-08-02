# Verifies the presence of a particular string in a file's first docblock or comment block (`headers/header-presence`)

🔧💡 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix) and manually fixable by [editor suggestions](https://eslint.org/docs/developer-guide/working-with-rules#providing-suggestions).

<!-- end auto-generated rule header -->

While there are several rules that enforce the existence of headers in source
files, these often conflict with tools that use or add preprocessor directives
or pragmas embedded in these comments (e.g. jest). This rule exists to enforce
the existence of specific header content while maintaining these directives.

## Rule Details

This rule allows developers to enforce the presence of common header content
(e.g. copyright information) while preserving pragma expressions included
in the same comment block.

Examples of **incorrect** code for this rule:

```js
module.exports = 42;
```

Examples of **correct** code for this rule:

**Example 0:**
The header provided contains the text "This is a new header."

Original file:

```js
module.exports = 42;
```

Fixed file:

```js
/**
 * This is a new header.
 */
module.exports = 42;
```

**Example 1:**
The header provided contains the text "Copyright Star Date 100598.1 United
Federation of Planets. All rights reserved."

Original file:

```js
/**
 * @author James T. Kirk
 */

module.exports = 1701;
```

Fixed file:

```js
/**
 * Copyright Star Date 100598.1 United Federation of Planets. All rights reserved.
 *
 * @author James T. Kirk
 */

module.exports = 1701;
```

### Options

**source**: either `file` or `string`. Indicates the content to enforce
as a header.

**style**: either `line` or `jsdoc`. Indicates comment style to enforce.
Defaults to `jsdoc`.

**content**: Required when `source: "string"`. The string to enforce in the
header comment.

**path**: Required when `source: "file"`. Path to a file containing content
to enforce in a header comment.

**preservePragmas**: boolean, preserves pragma expressions in leading
comments when updating header. Defaults to `true`. No effect when `style: "line"`.

**blockPrefix**: string, prepended to the start of the comment block.

**blockSuffix**: string, appended at the end of the comment block.

**linePrefix**: string, prepended to the start of each line of content.

## When Not To Use It

Do not use this rule if you have no use for enforcing content in a file header.
