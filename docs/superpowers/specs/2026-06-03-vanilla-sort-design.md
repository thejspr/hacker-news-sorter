# Faster Sorting + jQuery Removal — Design

**Date:** 2026-06-03

## Problem

Sorting posts on the Hacker News front page is laggy. The current `sort_entries()` in
`content.js` is a bubble sort that mutates the live DOM on every swap (`remove`,
`insertAfter`, `before`), triggering a reflow per swap — O(n²) reflows. Scores are
also re-parsed from DOM text on every comparison, and `$("td.subtext")` is re-queried
inside the loop.

Separately, the extension ships jQuery 3.6.1 used across three files. The user wants
jQuery removed entirely.

## Goals

1. Sorting renders fast — no perceptible lag on a full front page (~30 posts).
2. No jQuery anywhere. Delete `jquery-3.6.1.min.js`.
3. Preserve existing behavior: Sort button, "Auto" keep-sorted checkbox (persisted in
   `localStorage`), search bar, and comment-page auto-linking.

## Non-goals

- No UI redesign. Same controls, same placement.
- No change to the "Auto" persistence mechanism (`localStorage` stays).

## Design

### Sorting (the performance fix) — `content.js`

Read-sort-write in three steps, one reflow total:

1. **Collect groups.** Each story on HN is three rows: `tr.athing` (title), the
   following `tr` containing `td.subtext` (score/comments), and a `tr.spacer`. Walk
   `document.querySelectorAll('.athing')` and group each athing with its subtext row
   and the trailing spacer (only when it has class `spacer`).
2. **Parse score once.** Read `.score` text per post; `parseInt` the leading number.
   Fallback to `0` when absent (job posts, etc.).
3. **Sort + single write.** `Array.prototype.sort` by score descending (stable, so
   equal scores keep page order). Append all rows of all groups, in sorted order, into
   a `DocumentFragment`, then `insertBefore` the fragment ahead of the first trailing
   row (the `morespace`/"More" row, captured before mutation). One DOM insert.

Guard: only run when score-bearing subtext rows exist, so it no-ops on pages without a
sortable list.

### Search bar — `content.js`

Vanilla `document.createElement` + `addEventListener`. Append the search input and
button to the first header span. Click / Enter → redirect to
`hn.algolia.com/?q=<encoded>`. Same behavior as today.

### Auto-linking — `auto-link.js`

Replace the jQuery-based `linkify` plugin with a small vanilla function. On
`item?id=` pages, walk text nodes under `<body>`, wrap `http(s)://`, `www.`, and
`mailto:` matches in `<a target="_blank">` with underlined text. Skip text inside
`a`, `button`, `textarea`, `script`, and `style` nodes (same exclusions the plugin
had).

### Background page — `background.html` + `manifest.json`

`background.html` is dead under Manifest V3: it uses the MV2-only `chrome.pageAction`
and `chrome.extension.onRequest`, and `"background": "background.html"` is an invalid
MV3 manifest key. It does nothing today except load jQuery. **Delete `background.html`
and remove the `"background"` key** from the manifest.

### Manifest + bundle

- `content_scripts.js` becomes `["content.js", "auto-link.js"]` (jQuery removed).
- Delete `jquery-3.6.1.min.js`.

## Testing / verification

- Load the unpacked extension, open the HN front page: click **Sort** → posts reorder
  by points descending with no lag; toggle **Auto**, reload → list is sorted on load.
- Search box: type a query, press Enter / click Search → lands on Algolia results.
- Open a comment page (`item?id=...`): bare URLs in comments become clickable links
  opening in a new tab.
- Confirm no `jQuery`/`$` references remain and `jquery-3.6.1.min.js` is gone.
