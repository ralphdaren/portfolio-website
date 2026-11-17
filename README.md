# Ralph Daren · Portfolio

Personal portfolio site. Plain HTML, CSS and JavaScript modules, no build step.

## Run locally

The JavaScript uses ES modules, which browsers won't load from `file://`, so serve the folder:

```sh
npx serve .
# or: python3 -m http.server
```

or use the VS Code Live Server extension.

## Structure

```
index.html                  page markup, one <section> per component
public/                     static files, linked as-is
  favicon.ico
  icons/                    favicon + home-screen icons
  images/                   hero, about and project screenshots
  ralph-daren-resume.pdf
src/
  main.js                   entry: imports each component and starts it
  styles/
    index.css               entry: imports every stylesheet below
    tokens.css              colours, fonts, easing
    base.css                reset and body defaults
    layout.css              shared section layout (.sec, .wrap, headings)
  components/
    <Name>/<Name>.css       styles for that section only
    <Name>/<Name>.js        exports init<Name>(), if the section needs JS
  utils/
    storage.js              localStorage wrapper that never throws
mockups/                    design mockups (git-ignored)
vercel.json                 serves the project root (see Deploy)
```

## Deploy

Hosted on Vercel with no build step. `vercel.json` sets the output directory to the project root;
without it, Vercel treats `public/` as the whole site and the homepage returns 404.

## Adding a section

1. Add the `<section id="name" class="sec">` markup to `index.html` and a link to it in the side nav.
2. Create `src/components/Name/Name.css` and `@import` it in `src/styles/index.css`.
3. If it needs behaviour, create `src/components/Name/Name.js` exporting `initName()`, then import and call it in `src/main.js`.

## Guided tour

`src/components/Tour/Tour.js` exports `createTour({ id, steps })` and `autoplayOnce(section, tour, key)`.
See `src/components/Projects/Projects.js` for an example. Add `?tour=reset` to the URL to see a first-visit tour again.
