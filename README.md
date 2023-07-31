# eslint-plugin-headers

Rules for detecting and enforcing file headers.

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
      { "type": "string", "content": "Hello World!" }
    ]
  }
}
```

## Rules

<!-- begin auto-generated rules list -->

🔧 Automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/user-guide/command-line-interface#--fix).\
💡 Manually fixable by [editor suggestions](https://eslint.org/docs/developer-guide/working-with-rules#providing-suggestions).

| Name                                             | Description                                                                              | 🔧 | 💡 |
| :----------------------------------------------- | :--------------------------------------------------------------------------------------- | :- | :- |
| [header-presence](docs/rules/header-presence.md) | Verifies the presence of a particular string in a file's first docblock or comment block | 🔧 | 💡 |

<!-- end auto-generated rules list -->
