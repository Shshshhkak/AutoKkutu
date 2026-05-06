(function () {
  // Autoplay engine that watches turn state, selects a candidate word, and submits it.
  const g = window.KkutuBot = window.KkutuBot || {};
  if (g.Engine) return;

  const state = {
    running: false,
    lastAction: '',
    lastWord: '',
    lastCandidate: '',
    error: null,
    turnCount: 0,
    promise: Promise.resolve(),
  };

  function log(message) {
    console.log('[KkutuBot]', message);
    state.lastAction = message;
  }

  function isSafePage() {
    return g.DOM?.isGamePage();
  }

  function normalizeStartChar(word) {
    const last = g.DOM.getLastHangulChar(word);
    return last;
  }

  async function chooseWord(startChar) {
    const usedSet = new Set(g.DOM.getWordHistory());
    const candidates = g.WordList?.getCandidates(startChar, usedSet) || [];
    if (!candidates.length) {
      log(`No candidate words found for start character ${startChar}`);
      return null;
    }

    for (const candidate of candidates) {
      try {
        const valid = await g.Dict.isValidWord(candidate);
        if (valid) {
          return candidate;
        }
      } catch (error) {
        log(`Dictionary lookup failed for ${candidate}: ${error}`);
        state.error = error;
      }
    }

    log(`All ${candidates.length} candidate words were rejected by the dictionary.`);
    return null;
  }

  async function playTurn() {
    if (!isSafePage()) {
      state.error = 'Not on a kkutu game page.';
      return;
    }

    if (!g.DOM.isMyTurn()) {
      return;
    }

    const lastWord = g.DOM.getLastWord();
    if (!lastWord) {
      log('Cannot read the current game word.');
      return;
    }

    const startChar = normalizeStartChar(lastWord);
    if (!startChar) {
      log(`Unable to determine the start character from '${lastWord}'.`);
      return;
    }

    const candidate = await chooseWord(startChar);
    if (!candidate) {
      log(`No valid word could be chosen for start '${startChar}'.`);
      return;
    }

    try {
      g.DOM.sendWord(candidate);
      state.turnCount += 1;
      state.lastWord = lastWord;
      state.lastCandidate = candidate;
      log(`Submitted word '${candidate}' for next turn after '${lastWord}'.`);
    } catch (error) {
      state.error = error;
      log(`Failed to send word '${candidate}': ${error}`);
    }
  }

  async function tick() {
    if (!state.running) return;
    if (!isSafePage()) {
      log('Stopped because this is not a kkutu game page.');
      state.running = false;
      return;
    }

    const isTurn = g.DOM.isMyTurn();
    if (isTurn) {
      await playTurn();
    }
  }

  function scheduleNext() {
    if (!state.running) return;
    state.promise = state.promise.then(() => new Promise(resolve => {
      window.setTimeout(async () => {
        await tick();
        resolve();
      }, 1000);
    })).then(() => {
      if (state.running) scheduleNext();
    });
  }

  g.Engine = {
    start() {
      if (state.running) {
        log('KkutuBot is already running.');
        return;
      }
      if (!isSafePage()) {
        log('Cannot start: not on a supported kkutu game page.');
        return;
      }
      state.running = true;
      state.error = null;
      log('KkutuBot started. Waiting for your turn.');
      scheduleNext();
    },

    stop() {
      if (!state.running) {
        log('KkutuBot is not running.');
        return;
      }
      state.running = false;
      log('KkutuBot stopped.');
    },

    status() {
      return {
        running: state.running,
        lastAction: state.lastAction,
        lastWord: state.lastWord,
        lastCandidate: state.lastCandidate,
        error: state.error,
        turnCount: state.turnCount,
      };
    },

    async playOnce() {
      await tick();
    },

    addWords(words) {
      g.WordList?.addWords(words);
      log(`Added ${Array.isArray(words) ? words.length : 0} words to the candidate pool.`);
    },
  };
})();
