# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development

No build step, package manager, or test suite. To develop locally, serve the root directory over HTTP (required because `script.js` and `admin.js` use ES module imports):

```bash
npx serve .
# or
python3 -m http.server 8080
```

Opening `index.html` directly as a `file://` URL will fail due to CORS restrictions on the Firebase SDK module imports.

To deploy to Firebase Hosting:

```bash
firebase deploy
# or deploy only hosting
firebase deploy --only hosting
# or deploy only Firestore rules
firebase deploy --only firestore:rules
```

The Firebase project is `portfolio-site-db` (defined in `.firebaserc`).

## Architecture

This is a no-framework static site with two pages and a Firebase backend:

- **`index.html` + `script.js`** — Public portfolio. On load, `script.js` fetches the `projects` Firestore collection and renders project cards into `#dynamic-project-grid`. The contact form writes to the `contacts` collection.
- **`admin.html` + `admin.js`** — Password-protected admin dashboard using Firebase Email/Password Auth. After login, the admin can add/delete projects (written to Firestore) and read/delete contact submissions.
- **`styles.css`** — Single stylesheet shared by both pages. Uses CSS custom properties for theming. Dark theme is the default (no attribute); light theme is activated by setting `data-theme="light"` on `<html>`.

Firebase SDK is loaded via CDN (`https://www.gstatic.com/firebasejs/10.11.0/...`), so there are no local dependencies.

## Firestore Data Model

**`projects` collection** — read publicly, write requires auth:
- `title` (string)
- `description` (string)
- `cssClass` (string) — CSS class applied to `.project-image` div for background styling
- `status` (string) — badge text; if it contains "finish" (case-insensitive) the badge gets class `finished`, otherwise `concept`
- `linkText` (string)
- `createdAt` (serverTimestamp) — used for `orderBy("createdAt", "desc")`

**`contacts` collection** — create publicly, read/delete requires auth:
- `name`, `email`, `message` (strings)
- `timestamp` (serverTimestamp)

## Theming

Theme state lives entirely in the DOM — no localStorage persistence. The toggle in the navbar switches `document.documentElement`'s `data-theme` attribute between absent (dark) and `"light"`. Both `index.html` and `admin.html` implement this toggle independently in their respective JS files.

## Adding Project Card Visuals

Project card backgrounds are plain `<div>` elements styled by the `cssClass` field from Firestore. To add a new visual style for a project, add a CSS rule targeting `.project-image.<class-name>` in `styles.css` (e.g., a `background` gradient or `background-image`).
