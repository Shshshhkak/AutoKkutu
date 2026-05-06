# kkutu.co.kr Browser Bot

This folder contains a browser-executable version of AutoKkutu for `kkutu.co.kr`.

## Usage

Open the browser console on a kkutu game page and run:

```js
fetch('https://raw.githubusercontent.com/<OWNER>/<REPO>/main/browser/kkutu-bundle.js')
  .then(r => r.text())
  .then(eval);
```

Then start the bot with:

```js
KkutuBot.Engine.start();
```

To stop the bot:

```js
KkutuBot.Engine.stop();
```

To inspect the current state:

```js
KkutuBot.Engine.status();
```

## Files

- `kkutu-dom.js`: page selectors and chat input helpers for kkutu game pages.
- `kkutu-dict.js`: site dictionary validation via `/o/dict/<word>?lang=ko`.
- `kkutu-wordlist.js`: compact in-browser word candidate library.
- `kkutu-engine.js`: turn detection, candidate selection, and automatic play loop.
- `kkutu-bundle.js`: single-file browser entrypoint combining all of the above.

## Notes

- The bot uses kkutu.co.kr site dictionary validation; it does not use the local database engine.
- It requires you to be on a kkutu game page and already logged in.
- If the DOM structure changes, selectors may break and the script may stop working.
- The word list is compact and may not cover every possible chain; if the bot cannot find a word, it will log a message to the console.
- The bot submits chat through the page's own input and submit button, so it runs entirely inside the browser.
