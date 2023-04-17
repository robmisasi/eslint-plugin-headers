# Verifies the presence of a particular string in a file's first docblock (`header-docblock/header-presence`)

🔧💡 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix) and manually fixable by [editor suggestions](https://eslint.org/docs/developer-guide/working-with-rules#providing-suggestions).

<!-- end auto-generated rule header -->

While there are several rules that enforce the existence of headers in source
files, these often conflict with tools (e.g. jest) that use preprocessor
directives embedded in these comments. This rule exists to enforce the
existence of specific content while allowing additional content to exist in
these comments.

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
 */

module.exports = 42;
```

### Options

**type**: either `file` or `string`. Indicates where or what content to enforce
as a header.

**content**: Required when `type: "string"`. The string to check in the
header JSDoc comment.

**path**: Required when `type: "file"`. Path to a file containing content
to check in a header JSDoc comment.

## When Not To Use It

Do not use this rule if you have no use for enforcing a file header.
