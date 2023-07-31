# Verifies the presence of a particular string in a file's first docblock or comment block (`headers/header-presence`)

🔧💡 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix) and manually fixable by [editor suggestions](https://eslint.org/docs/developer-guide/working-with-rules#providing-suggestions).

<!-- end auto-generated rule header -->

While there are several rules that enforce the existence of headers in source
files, these often conflict with tools that use or add preprocessor directives
or pragmas embedded in these comments. This rule exists to enforce the
existence of specific header content while maintaining these directives.

## Rule Details

This rule allows developers to enforce the presence of common header content
(e.g. copyright information) while allowing additional content to be included
in the same comment block.

Examples of **incorrect** code for this rule:

```js
module.exports = 42;
```

Examples of **correct** code for this rule:

```js
/**
 * This is the enforced header.
 *
 * @author James T. Kirk
 */

module.exports = 42;
```

### Options

**source**: either `file` or `string`. Indicates the content to enforce
as a header.

**style**: either `line` or `jsdoc`. Indicates comment style to enforce.
Defaults to `jsdoc`.

**content**: Required when `source: "string"`. The string to enforce in the
header comment.

**path**: Required when `source: "file"`. Path to a file containing content
to check in a header comment.

## When Not To Use It

Do not use this rule if you have no use for enforcing content in a file header.
