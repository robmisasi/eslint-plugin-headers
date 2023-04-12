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
    "plugins": [
        "header-docblock"
    ]
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
TODO: Run eslint-doc-generator to generate the rules list.
<!-- end auto-generated rules list -->


