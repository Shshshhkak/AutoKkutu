(function () {
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
    tickInterval: 3000,
  };

  function log(message) {
    console.log('[KkutuBot]', message);
    state.lastAction = message;
  }

  function isSafePage() {
    return g.DOM?.isGamePage?.();
  }

  function getLastHangulChar(word) {
    if (!word) return '';
    const matches = word.match(/[\uAC00-\uD7A3]/g);
    return matches ? matches[matches.length - 1] : '';
  }

  async function chooseWord(startChar) {
    // 1. 이미 사용한 단어 수집
    const usedSet = new Set(g.DOM?.getWordHistory?.() || []);
    
    // 2. 후보 단어 가져오기
    const candidates = g.WordList?.getCandidates(startChar, usedSet) || [];
    
    if (!candidates.length) {
      log(`No candidate words found for start character ${startChar}`);
      return null;
    }

    // 3. GUI 설정에서 활성화된 모드 가져오기
    const enabledModes = g.GUI?.getEnabledModes?.() || [];

    // 4. Strategy를 사용해 최적의 단어 선택
    let selectedWord;
    if (enabledModes.length > 0) {
      selectedWord = g.Strategy?.selectBestWord(candidates, enabledModes, usedSet);
    } else {
      selectedWord = candidates[0];
    }

    if (!selectedWord) {
      log(`No valid word could be chosen for start '${startChar}'.`);
      return null;
    }

    // 5. 최대 3개까지만 검증 (API 부하 제어)
    const maxCheckCount = Math.min(3, candidates.length);
    const checkList = candidates.slice(0, maxCheckCount);

    for (const candidate of checkList) {
      try {
        const valid = await g.Dict?.isValidWord(candidate);
        if (valid) {
          return candidate;
        }
      } catch (error) {
        log(`Dictionary lookup error for ${candidate}: ${error.message || error}`);
      }
    }

    // 검증된 단어가 없으면 선택된 단어 사용
    log(`No verified word found, using selected: ${selectedWord}`);
    return selectedWord;
  }

  async function playTurn() {
    if (!isSafePage()) {
      state.error = 'Not on a kkutu game page.';
      return;
    }

    if (!g.DOM?.isMyTurn?.()) {
      return;
    }

    const lastWord = g.DOM?.getLastWord?.();
    if (!lastWord) {
      log('Cannot read the current game word.');
      return;
    }

    const startChar = getLastHangulChar(lastWord);
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
      g.DOM?.sendWord(candidate);
      state.turnCount += 1;
      state.lastWord = lastWord;
      state.lastCandidate = candidate;
      
      // 선택된 모드 정보를 포함한 로그
      const modes = g.GUI?.getEnabledModes?.() || [];
      log(`Submitted '${candidate}' (${modes.join(', ') || 'no mode'}) for '${lastWord}'`);
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

    if (g.DOM?.isChatDisconnected?.()) {
      log('WebSocket disconnected. Pausing for 5 seconds...');
      state.tickInterval = 5000;
      setTimeout(() => {
        state.tickInterval = 3000;
      }, 5000);
      return;
    }

    const isTurn = g.DOM?.isMyTurn?.();
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
      }, state.tickInterval);
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
      const dictStats = g.Dict?.getCacheStats?.() || {};
      return {
        running: state.running,
        lastAction: state.lastAction,
        lastWord: state.lastWord,
        lastCandidate: state.lastCandidate,
        error: state.error,
        turnCount: state.turnCount,
        tickInterval: state.tickInterval,
        dictCache: dictStats.cachedWords,
        pendingDictRequests: dictStats.pendingRequests,
      };
    },

    setTickInterval(ms) {
      if (ms < 500) {
        log('Warning: Interval below 500ms may cause server overload. Setting minimum to 500ms.');
        state.tickInterval = 500;
      } else {
        state.tickInterval = ms;
        log(`Tick interval set to ${ms}ms`);
      }
    },

    clearDictCache() {
      g.Dict?.clearCache?.();
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

