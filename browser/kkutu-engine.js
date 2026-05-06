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
    tickInterval: 3000, // 체크 간격 증가 (밀리초) - 서버 부하 감소
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

    // 최대 3개까지만 검증 - API 부하 제어 (더욱 강화)
    const maxCheckCount = Math.min(3, candidates.length);
    const checkList = candidates.slice(0, maxCheckCount);

    for (const candidate of checkList) {
      try {
        const valid = await g.Dict.isValidWord(candidate);
        if (valid) {
          return candidate;
        }
      } catch (error) {
        log(`Dictionary lookup error for ${candidate}: ${error.message || error}`);
        // 에러는 기록하지만 계속 진행
      }
    }

    // 검증된 단어가 없으면 첫 번째 후보 사용 (시간 초과 방지)
    if (candidates.length > 0) {
      log(`No verified word found in ${maxCheckCount} candidates, using fallback: ${candidates[0]}`);
      return candidates[0];
    }

    log(`All ${checkList.length} candidate words were rejected by the dictionary.`);
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

    // WebSocket 연결 상태 확인 (1005 오류 감지)
    if (g.DOM?.isChatDisconnected?.()) {
      log('WebSocket disconnected (1005 error detected). Pausing for 5 seconds...');
      state.tickInterval = 5000; // 일시적으로 간격 증가
      setTimeout(() => {
        state.tickInterval = 3000; // 5초 후 원래 간격으로 복원
      }, 5000);
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
      }, state.tickInterval); // 조정 가능한 간격 사용
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

    // 체크 간격 조정
    setTickInterval(ms) {
      if (ms < 500) {
        log('Warning: Interval below 500ms may cause server overload. Setting minimum to 500ms.');
        state.tickInterval = 500;
      } else {
        state.tickInterval = ms;
        log(`Tick interval set to ${ms}ms`);
      }
    },

    // 딕셔너리 캐시 강제 초기화
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
