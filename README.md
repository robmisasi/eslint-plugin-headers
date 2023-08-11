# eslint-plugin-headers

A flexible and `--fix`able rule for checking, inserting, and formatting file
headers.

Supports configurable usage of block or line comments, custom comment block
prefixes and suffixes, custom line prefixes, and spacing between the header
and code.

Useful for inserting, enforcing, and updating copyright or licensing notices
while preserving pragma expressions in leading content blocks.

## Installation

You'll first need to install [ESLint](https://eslint.org/):

```sh
npm i eslint --save-dev
```

Next, install `eslint-plugin-headers`:

```sh
npm install eslint-plugin-headers --save-dev
```

## Usage

Add `headers` to the plugins section of your `.eslintrc` configuration file. You can omit the `eslint-plugin-` prefix:

```json
{
  "plugins": ["headers"]
}
```

Then configure the rules you want to use under the rules section.

```json
{
  "rules": {
    "headers/header-format": [
      "error",
      {
        "source": "string",
        "content": "Copyright 2023. All rights reserved."
      }
    ]
  }
}
```

**Example 0:**

Using the configuration from above, here's a file without a matching header:

```js
module.exports = 42;
```

When the fix is applied, the file now appears so:

```js
/**
 * Copyright 2023. All rights reserved.
 */
module.exports = 42;
```

**Example 1:**

Using the same configuration, this file already has a header, this one containing pragmas:

```js
/**
 * @fileoverview This file contains a magic number.
 * @author Rob Misasi
 */
module.exports = 42;
```

When the fix is applied, the file now appears so:

```js
/**
 * Copyright 2023. All rights reserved.
 *
 * @fileoverview This file contains a magic number.
 * @author Rob Misasi
 */
module.exports = 42;
```

### Options

Options are supplied through a single object with the following properties:

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

## Future

* Add support for common pragma expressions that don't utilize the `@` symbol (e.g. eslint-disable)

## Rules

<!-- begin auto-generated rules list -->

🔧 Automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/user-guide/command-line-interface#--fix).

| Name                                         | Description                                                        | 🔧  |
| :------------------------------------------- | :----------------------------------------------------------------- | :-- |
| [header-format](docs/rules/header-format.md) | Verifies the content and format of a file's leading comment block. | 🔧  |

<!-- end auto-generated rules list -->
