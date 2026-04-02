# CodeSeed

CodeSeed is a zero-dependency static app that generates small software project ideas you could actually build. Each idea comes with a scope, a hook, an MVP checklist, stretch goals.


## Features

- Seeded project ideas so the same filters always recreate the same result
- Filters for platform, vibe, and scope
- Save favorites in local storage
- Copy a shareable URL for any generated idea
- Copy the full idea as markdown for a repo README or issue template
- Pure ES modules with no build step or external dependencies

## Run locally

Open [index.html](./index.html) directly in your browser, or serve the folder with a static server.

If you have Python installed:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Test

```bash
npm test
```

The tests cover the deterministic generator logic in [`src/generator.js`](./src/generator.js).

## Project structure

```text
.
|-- app.js
|-- index.html
|-- styles.css
|-- src/
|   `-- generator.js
`-- tests/
    `-- generator.test.mjs
```
