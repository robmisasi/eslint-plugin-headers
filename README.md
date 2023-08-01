# eslint-plugin-headers

Rules for checking and automatically inserting file headers.

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
    "headers/header-presence": [
      "error",
      {
        "source": "string",
        "content": "Copyright 2023. All rights reserved."
      }
    ]
  }
}
```

Original file without header:

```js
module.exports = 42;
```

Fixed file:

```js
/**
 * Copyright 2023. All rights reserved.
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
to enforce in a header comment.

**preservePragmas**: boolean, preserves pragma expressions in leading
comments when updating header. Defaults to `true`. No effect when `style: "line"`.

## Rules

<!-- begin auto-generated rules list -->

🔧 Automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/user-guide/command-line-interface#--fix).\
💡 Manually fixable by [editor suggestions](https://eslint.org/docs/developer-guide/working-with-rules#providing-suggestions).

| Name                                             | Description                                                                              | 🔧  | 💡  |
| :----------------------------------------------- | :--------------------------------------------------------------------------------------- | :-- | :-- |
| [header-presence](docs/rules/header-presence.md) | Verifies the presence of a particular string in a file's first docblock or comment block | 🔧  | 💡  |

<!-- end auto-generated rules list -->
