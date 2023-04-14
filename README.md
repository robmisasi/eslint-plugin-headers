# eslint-plugin-header-docblock

Rules for detecting file headers in docblock pragmas.

## Installation

You'll first need to install [ESLint](https://eslint.org/):

```sh
npm i eslint --save-dev
```

Next, install `eslint-plugin-header-docblock`:

```sh
npm install eslint-plugin-header-docblock --save-dev
```

## Usage

Add `header-docblock` to the plugins section of your `.eslintrc` configuration file. You can omit the `eslint-plugin-` prefix:

```json
{
  "plugins": ["header-docblock"]
}
```

Then configure the rules you want to use under the rules section.

```json
{
  "rules": {
    "header-docblock/rule-name": 2
  }
}
```

## Rules

<!-- begin auto-generated rules list -->

🔧 Automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/user-guide/command-line-interface#--fix).\
💡 Manually fixable by [editor suggestions](https://eslint.org/docs/developer-guide/working-with-rules#providing-suggestions).

| Name                                             | Description                                                             | 🔧  | 💡  |
| :----------------------------------------------- | :---------------------------------------------------------------------- | :-- | :-- |
| [header-presence](docs/rules/header-presence.md) | Verifies the presence of a particular string in a file's first docblock | 🔧  | 💡  |

<!-- end auto-generated rules list -->
