# SkiSchool.ge booking form

One bilingual (RU/EN) booking form instead of two separate copies.

## Files

| File | What it's for | Edit this when... |
|---|---|---|
| `index.html` | Page structure only (markup, form fields, sections) | You need to add/remove a field or section |
| `i18n.js` | **Every** piece of user-facing text, in Russian and English | You want to reword anything, or add a new language |
| `app.js` | All logic — pricing, calendar, availability check, validation, PayPal, email/webhook | You need to change how the form *behaves* |
| `styles.css` | Visual styling (unchanged from before) | You want to change how it looks |

Nothing here changes what the form does or how it looks — same fields, same
pricing rules, same PayPal flow, same webhook/email destinations. It's the
same two forms you had, merged into one set of files.

## How the language is chosen

On page load, `app.js` picks a language in this order:

1. **`?lang=ru` or `?lang=en` in the URL** — use this to force a language.
   This is the one to use when embedding in Carrd: if you have a Russian
   page and an English page, just point their embeds/iframes at
   `.../index.html?lang=ru` and `.../index.html?lang=en` respectively.
2. **The visitor's browser language** — if no `?lang=` is given, a browser
   set to Russian gets the Russian form automatically, otherwise English.
3. **English** — fallback if neither of the above applies. (Change
   `DEFAULT_LANG` at the bottom of `i18n.js` if you'd rather default to
   Russian.)

There's no visible language toggle button — nothing was added to the visual
form. If you'd actually like a toggle switch on the page itself, that's a
small addition, just say so.

## How to edit wording

Open `i18n.js`. Every string is there, grouped by language (`ru` / `en`),
labeled by what it's used for (button text, error messages, email templates,
etc.), with comments. Change the text, save, done — `app.js` and
`index.html` don't need to be touched.

## How to add a third language (e.g. Georgian)

1. In `i18n.js`, copy the entire `en: { ... }` block and paste it as a new
   entry, e.g. `ka: { ... }`.
2. Translate every value (the calendar month names, week-start convention,
   button text, email templates, everything).
3. At the bottom of `i18n.js`, add `'ka'` to the `SUPPORTED_LANGS` array.
4. That's it — `?lang=ka` will now work, and browsers set to Georgian will
   pick it up automatically.

## Deploying

Same as before: `index.html`, `i18n.js`, `app.js`, and `styles.css` need to
sit in the same folder (e.g. all at the repo root, as they did before).
The two old files (`index.html`-ru and the English one, whatever they were
named) can be deleted once you've confirmed the merged version works — this
one replaces both.

One thing worth double-checking on your end: `server.js` (not shown to me)
may have routing that pointed at two separate HTML files or two separate
paths for RU/EN. If so, it should now just serve this one `index.html` for
every route, and let the `?lang=` parameter (or browser detection) handle
the rest.

## What was verified before delivery

- All booking-math (pricing, deposits, discounts) checked against the
  original formulas with sample inputs — same output.
- Every element ID that `app.js` looks up was cross-checked against
  `index.html` — nothing missing.
- The one *real* (non-text) difference between the old RU and EN files —
  the calendar's first day of the week (Monday for RU, Sunday for EN, a
  genuine locale convention, not just a translation) — was preserved via
  the `weekStartsMonday` flag per language, not flattened into one behavior.
- PayPal client ID, EmailJS service/template IDs, the availability-check
  API URL, and the booking-bot webhook URL are all unchanged.
