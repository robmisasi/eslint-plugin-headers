# Verifies the content and format of a file's leading comment block (`headers/header-format`)

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

While there are several rules that enforce the existence of headers in source
files, these often conflict with tools that use or add preprocessor directives
or pragmas embedded in these comments (e.g. jest and `@jest-environment`). This
rule exists to enforce the existence of specific header content while
maintaining these directives.

## Rule Details

This rule allows developers to enforce the format and presence of common header
content (e.g. copyright information) while preserving pragma expressions
included in the same comment block.

### Templates

The provided header content can be formatted with variable information using
the `variables` configuration option. Keys within the header content must be
wrapped in braces to be formatted properly. For example, the configuration:

```json
{
  ...
  "content": "This is an {exampleKey}.",
  "variables": {
    "exampleKey": "example value"
  }
}
```

produces the following header:

```js
/**
 * This is an example value.
 */
```

### Examples

Examples of **incorrect** code for this rule:

```js
module.exports = 42;
```

Examples of **correct** code for this rule:

**Example 0: Enforcing content**
Configuration:

```json
{
  "rules": {
    "headers/header-format": [
      "error",
      {
        "source": "string",
        "content": "This is a new header."
      }
    ]
  }
}
```

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

**Example 1: Enforcing content from a file**
Configuration:

```json
{
  "rules": {
    "headers/header-format": [
      "error",
      {
        "source": "file",
        "path": "./LICENSE"
      }
    ]
  }
}
```

LICENSE:

```txt
Copyright Star Date 100598.1 United Federation of Planets. All rights reserved.
```

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

**Example 2: Using template variables**
Configuration:

```json
{
  "rules": {
    "headers/header-format": [
      "error",
      {
        "source": "string",
        "content": "Copyright Star Date {stardate} {company}. All rights reserved.",
        "variables": {
          "stardate": "101012.2",
          "company": "United Federation of Planets"
        }
      }
    ]
  }
}
```

Original file:

```js
/**
 * @author Jean-Luc Picard
 */
module.exports = "1701-D";
```

Fixed file:

```js
/**
 * Copyright Star Date 101012.2 United Federation of Planets. All rights reserved.
 *
 * @author Jean-Luc Picard
 */
module.exports = "1701-D";
```

### Options

| Name             | Type               | Required                | Default                                                | Description                                                                                                                                                          |
| ---------------- | ------------------ | ----------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| source           | "file" \| "string" | Yes                     |                                                        | Indicates how the header content is supplied.                                                                                                                        |
| style            | "line" \| "jsdoc"  | No                      | "jsdoc"                                                | Indicates the comment style to enforce. A leading line-style comment block will only include adjacent line comments, although a line comment's content may be empty. |
| content          | string             | When `source: "string"` |                                                        | The string to enforce in the header comment.                                                                                                                         |
| path             | string             | When `source: "file"`   |                                                        | The path to a file containing the header content to enforce.                                                                                                         |
| preservePragmas  | boolean            | No                      | `true`                                                 | Preserves existing pragma expressions in leading comments when updating header. No effect when `style: "line"`.                                                      |
| blockPrefix      | string             | No                      | "\*" + newline when `style: "jsdoc"`                   | Content at the start of the leading comment block.                                                                                                                   |
| blockSuffix      | string             | No                      | newline + " " when `style: "jsdoc"`                    | Content at the end of the leading comment block.                                                                                                                     |
| linePrefix       | string             | No                      | " \* " when `style: "jsdoc"`, " " when `style: "line"` | Content prepended to the start of each line of content.                                                                                                              |
| trailingNewlines | number             | No                      |                                                        | Number of empty lines to enforce after the leading comment.                                                                                                          |
| variables        | object             | No                      |                                                        | The keys to find and values to fill when formatting the provided header. Values must be strings.                                                                     |

## When Not To Use It

Do not use this rule if you have no use for enforcing leading text content in a
file header.
