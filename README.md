# Ralph Daren · Portfolio

Personal portfolio site. Plain HTML, CSS and JavaScript, no build step.

## Run locally

Open `index.html` in a browser (double-click works). A local server such as VS Code Live Server
also works and auto-refreshes on save.

The scripts are plain scripts, not ES modules, on purpose: browsers block modules on `file://`.
Each file wraps itself in a function and adds what it shares to one global, `window.Site`.

## Structure

```
index.html                  page markup, one <section> per component
public/                     static files, linked as-is
  favicon.ico
  icons/                    favicon + home-screen icons
  images/                   hero, about, project screenshots, gear/ (desk photo + product PNGs), experience/ (company logos)
src/
  main.js                   entry: starts each component (runs last)
  styles/
    index.css               entry: imports every stylesheet below
    tokens.css              colours, fonts, easing
    base.css                reset and body defaults
    layout.css              shared section layout (.sec, .wrap, headings)
  components/
    <Name>/<Name>.css       styles for that section only
    <Name>/<Name>.js        adds Site.init<Name>(), if the section needs JS
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
3. If it needs behaviour, create `src/components/Name/Name.js`:
   ```js
   (function (Site) {
     const { storage } = Site;          // anything it uses from earlier files
     function initName() { /* ... */ }
     Object.assign(Site, { initName });
   })(window.Site = window.Site || {});
   ```
   Add a `<script src="src/components/Name/Name.js" defer>` tag to `index.html` before `main.js`
   (after any file it uses), then call `Site.initName()` in `src/main.js`.

## Guided tour

Give the section a `.tour-btn` and call `initSectionTour({ section, id, steps, onEnd })` from
`src/components/Tour/Tour.js` (see `Projects.js` or `Gear.js`).

- Tours never autoplay. The button reads "Take the tour", switches to "Stop tour" while the tour plays, then
  "Replay tour" once it ends (and "Stop tour" again during a replay).
- The first time a visitor reaches the section, a spotlight dims the page and highlights the button, with a card
  offering "Take the tour" or "Skip tour". It shows once per section and never blocks scrolling (Skip, Esc, a click outside, or scrolling away close it).
- Once started, a tour plays to the end: mouse, touch and scrolling within the section don't stop it. It ends if the
  visitor leaves the section (nav link, or scrolling it fully off screen), presses Esc, or clicks "Stop tour". Each step scrolls its
  target into view, and only one tour plays at a time.
- Synthetic clicks from a tour have `event.isTrusted === false`, so a component can tell them apart from real taps.
- Add `?tour=reset` to the URL to forget what was seen and see the spotlights again.

## Gear

Items live in `src/components/Gear/gearData.js` (name, specs, link, product image, and the dot's x / y position
on the desk photo in %). Product images are transparent PNGs in `public/images/gear/`, about 520px tall.
