// KKUTU browser bot bundle (Optimized for kkutu.co.kr)
// 실제 kkutu 페이지에서 안정적으로 작동하도록 최적화됨
// Version: 1.0.0
// Updated: 2026-05-06

(function() {
  // 번들 로딩 초기화
  if (typeof window !== 'undefined') {
    console.log('[KkutuBot] Loading bundle...');
  }
})();

// BEGIN browser/kkutu-dom.js
(function () {
  // Browser DOM helpers for kkutu.co.kr game pages.
  // These functions read the current game state and submit chat input.
  // 실제 kkutu.co.kr DOM 구조에 맞게 최적화
  const g = window.KkutuBot = window.KkutuBot || {};
  if (g.DOM) return;

  function $(selector) {
    return document.querySelector(selector);
  }

  function $all(selector) {
    return Array.from(document.querySelectorAll(selector));
  }

  function safeText(node) {
    return node?.textContent?.trim() || '';
  }

  function isVisible(el) {
    return el && el.offsetParent !== null && window.getComputedStyle(el).display !== 'none';
  }

  function findElement(...selectors) {
    for (const selector of selectors) {
      const el = $(selector);
      if (el) return el;
    }
    return null;
  }

  function cleanWord(input) {
    return String(input || '')
      .trim()
      .replace(/[\n\r\t]/g, '')
      .replace(/[^\uAC00-\uD7A3a-zA-Z0-9ㄱ-ㅎ\s]/g, '')
      .trim();
  }

  g.DOM = {
    getGameMode() {
      const node = $('.room-head-mode') || $('.jjo-info-mode');
      const text = safeText(node);
      if (!text) return '';
      const parts = text.split('/')[0]?.trim();
      return parts ? parts.replace(/^\s*[^\s]*\s*/, '') : '';
    },

    getPresentWord() {
      const display = findElement(
        '.jjo-display.ellipse',
        '.jjo-display',
        '.game-word',
        '[data-word]'
      );
      return cleanWord(safeText(display));
    },

    getWordLength() {
      const node = findElement(
        '.jjo-display-word-length',
        '.word-length',
        '.game-word-length'
      );
      const text = safeText(node);
      if (!text) return 0;
      const match = text.match(/\d+/);
      return match ? Number(match[0]) : 0;
    },

    isMyTurn() {
      const input = findElement(
        '.game-input',
        '#Talk',
        'input[placeholder*="단어"]',
        'input[id*="input"]'
      );
      return Boolean(input && isVisible(input));
    },

    getTurnError() {
      return safeText(findElement(
        '.game-fail-text',
        '.jjo-fail',
        '.error-message'
      ));
    },

    getTurnTime() {
      const node = findElement(
        '.graph.jjo-turn-time > .graph-bar',
        '[class*="turn"] [class*="time"]',
        '.turn-timer'
      );
      const text = safeText(node);
      if (!text) return '';
      return text.replace(/\D+$/, '');
    },

    getRoundTime() {
      const node = findElement(
        '.graph.jjo-round-time > .graph-bar',
        '[class*="round"] [class*="time"]',
        '.round-timer'
      );
      const text = safeText(node);
      if (!text) return '';
      return text.replace(/\D+$/, '');
    },

    getWordHistory() {
      return $all('.ellipse.history-item.expl-mother')
        .map(v => cleanWord(safeText(v.childNodes[0])))
        .filter(Boolean)
        .concat(
          $all('.jjo-history span, [class*="history"] span')
            .map(v => cleanWord(safeText(v)))
            .filter(Boolean)
        )
        .filter((w, i, arr) => arr.indexOf(w) === i); // 중복 제거
    },

    getChatBox() {
      return findElement(
        '#Talk',
        'input[type="text"]',
        'input[placeholder*="단어"]',
        '.game-input'
      );
    },

    sendWord(word) {
      const chat = this.getChatBox();
      const button = findElement('#ChatBtn', '[class*="send"]', 'button[type="submit"]');
      
      if (!chat || !button) {
        throw new Error('Chat input or submit button not found on this page.');
      }
      
      const wordStr = String(word).trim();
      chat.focus();
      
      // 입력값 설정 및 이벤트 발생
      chat.value = wordStr;
      
      // 이벤트 순서: beforeinput -> input -> change -> keyup
      const events = [
        new Event('beforeinput', { bubbles: true, cancelable: true }),
        new Event('input', { bubbles: true }),
        new Event('change', { bubbles: true }),
        new KeyboardEvent('keydown', { bubbles: true, key: 'Enter', code: 'Enter', keyCode: 13 }),
        new KeyboardEvent('keyup', { bubbles: true, key: 'Enter', code: 'Enter', keyCode: 13 }),
      ];
      
      events.forEach(evt => chat.dispatchEvent(evt));
      
      // 버튼 클릭
      setTimeout(() => {
        button.click();
      }, 100);
    },

    getLastWord() {
      const present = this.getPresentWord();
      if (present) return present;
      const history = this.getWordHistory();
      return history[history.length - 1] || '';
    },

    getLastHangulChar(word) {
      const cleaned = cleanWord(word);
      const matches = cleaned.match(/[\uAC00-\uD7A3]/g);
      if (!matches || !matches.length) return '';
      return matches[matches.length - 1];
    },

    getCurrentRoundIndex() {
      const rounds = $all('#Middle>div.GameBox.Product>div>div.game-head>div.rounds>label');
      const current = $('.rounds-current');
      return current ? rounds.indexOf(current) : -1;
    },

    isGamePage() {
      // 게임 페이지 인식: 핵심 요소 중 하나 이상 존재
      return Boolean(
        this.getPresentWord() ||
        this.getChatBox() ||
        $('[class*="game"]') ||
        $('[class*="jjo"]')
      );
    },

    isChatDisconnected() {
      return Boolean(
        findElement(
          '.chat-disconnect',
          '.socket-error-message',
          '[class*="disconnect"]',
          '[class*="error"]'
        )
      );
    },

    cleanWord,
  };
})();

// BEGIN browser/kkutu-dict.js
(function () {
  // Site dictionary validation for kkutu.co.kr.
  // The bot checks candidate words with the site's own /o/dict endpoint.
  // 캐싱, 동시성 제어, 타임아웃으로 안정적으로 작동
  const g = window.KkutuBot = window.KkutuBot || {};
  if (g.Dict) return;

  const cache = new Map(); // 단어 검증 캐시
  let pendingRequests = 0;
  const maxConcurrentRequests = 2; // 동시 요청 최대 수 (서버 부하 방지)
  const requestQueue = [];
  const REQUEST_TIMEOUT = 8000; // 8초 제한시간

  function withTimeout(promise, timeoutMs) {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
  }

  async function fetchWord(word) {
    const safe = String(word || '').trim();
    if (!safe || safe.length === 0) {
      return { valid: false, data: { error: 'empty word' } };
    }

    // 캐시 확인 - 이미 확인한 단어면 즉시 반환
    if (cache.has(safe)) {
      return cache.get(safe);
    }

    // 동시 요청 제한 - 대기열에 추가
    return new Promise((resolve) => {
      const executeRequest = async () => {
        pendingRequests++;

        try {
          // 여러 가능한 API 경로 시도 (fallback)
          const urls = [
            `/o/dict/${encodeURIComponent(safe)}?lang=ko`,
            `/api/dict/${encodeURIComponent(safe)}`,
            `https://kkutu.co.kr/o/dict/${encodeURIComponent(safe)}?lang=ko`,
          ];

          let response;
          let lastError;

          for (const url of urls) {
            try {
              response = await withTimeout(
                fetch(url, {
                  credentials: 'include',
                  method: 'GET',
                  headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Language': 'ko-KR,ko;q=0.9',
                    'X-Requested-With': 'XMLHttpRequest',
                    'User-Agent':
                      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                  },
                }),
                REQUEST_TIMEOUT
              );

              if (response.ok) {
                break;
              }
            } catch (error) {
              lastError = error;
              continue;
            }
          }

          if (!response || !response.ok) {
            throw lastError || new Error('All API endpoints failed');
          }

          const contentType = response.headers.get('content-type');
          let data;

          if (contentType && contentType.includes('application/json')) {
            data = await response.json();
          } else {
            const text = await response.text();
            try {
              data = JSON.parse(text);
            } catch {
              data = { raw: text };
            }
          }

          // 응답 분석
          const valid = isValidResponse(data);
          const result = { valid, data };
          cache.set(safe, result);
          resolve(result);
        } catch (error) {
          // 네트워크/타임아웃 오류 - 일단 유효하지 않은 것으로 처리
          const result = { valid: false, error: error.message };
          cache.set(safe, result);
          resolve(result);
        } finally {
          pendingRequests--;
          // 대기 중인 요청이 있으면 처리
          if (requestQueue.length > 0) {
            const nextRequest = requestQueue.shift();
            nextRequest();
          }
        }
      };

      if (pendingRequests < maxConcurrentRequests) {
        executeRequest();
      } else {
        requestQueue.push(executeRequest);
      }
    });
  }

  function isValidResponse(data) {
    // kkutu 서버의 응답 형식 분석
    if (!data) return false;
    if (data.error || data.code === 'E') return false; // 에러 응답
    if (data.code === 0 || data.m === null) return false; // 해석 불가
    if (data.m && (data.m.length > 0 || data.data)) return true; // 유효한 단어
    return Object.keys(data).length > 0 && !('error' in data); // 기본 응답이 있으면 유효
  }

  g.Dict = {
    async lookupWord(word) {
      return fetchWord(word);
    },

    async isValidWord(word) {
      const result = await fetchWord(word);
      return result.valid;
    },

    // 캐시 초기화
    clearCache() {
      cache.clear();
      console.log('[KkutuBot.Dict] Cache cleared.');
    },

    // 통계 정보
    getCacheStats() {
      return {
        cachedWords: cache.size,
        pendingRequests: pendingRequests,
        queuedRequests: requestQueue.length,
      };
    },
  };
})();

// BEGIN browser/kkutu-wordlist.js
(function(){
  const g = window.KkutuBot = window.KkutuBot || {};
  if (g.WordList) return;
  const wordMap = {
    '가': ['가성칼리','가매훌티','가망거리','가맛박적','가맛방석','가로동자','가로동요','가로닫이','가럭더리','가량없이'],
    '각': ['각시바꽃','각인각양','각인각성','각막혼탁','각인각자','각도주차','각유일능','각세진경','각산호목','각개약진'],
    '간': ['간섭현상','간섭필터','간첩주구','간헐효과','간접재료','간닥간닥','간접노동','간접난방','간호대학','간린스레'],
    '갇': ['갇모','갇긴'],
    '갈': ['갈색조류','갈색제비','갈비트림','갈비새김','갈비삭뼈','갈망간석','갈망간광','갈매깃과','갈색토양','갈파랫과'],
    '갉': ['갉아먹기','갉죽갉죽','갉작갉작','갉이질','갉이','갉작'],
    '감': ['감산혼색','감속장치','감산부호','감투장이','감투싸움','감속지체','감투쟁이','감정법학','감응계수','감응기뢰'],
    '갑': ['갑문운하','갑문신호','갑문부두','갑술옥사','갑인자체','갑작사랑','갑작변이','갑작스레','갑작부자','갑작바람'],
    '값': ['값같은선','값없이','값어치','값전자','값표'],
    '갓': ['갓난쟁이','갓난아이','갓다리꽃','갓난아기','갓등거리','갓드라몬','갓벙거지','갓병아리','갓스탠드','갓핑거'],
    '강': ['강감찬전','강계분지','강변칠읍','강소독서','강동육주','강화로봇','강선무기','강제매매','강멱급수','강제대류'],
    '갖': ['갖은삼포','갖추갖추','갖은안장','갖벙거지','갖은양념','갖은회상','갖풀관자','갖춘마침','갖등거리','갖은소리'],
    '같': ['같은자리','같은그루','같기기호','같이어김','같이가기','같은부피','같은비','같음표','같잖이','같기표'],
    '갚': ['갚음'],
    '개': ['개미잡이','개좆부리','개좆같이','개국공신','개밥궁이','개밥구유','개암버섯','개방사회','개방도로','개방대학'],
    '객': ['객자제지','객사지수','객설스레','객체표상','객체지향','객화차대','객관객체','객관세계','객고막심','객반위주'],
  };
  const allWords = Object.values(wordMap).flat();
  g.WordList = {
    wordMap,
    getCandidates(start, usedSet){
      if (!start) return [];
      const list = wordMap[start] || [];
      return list.filter(w => !usedSet.has(w));
    },
    addWords(words){
      for (const word of words){ 
        if (typeof word!=="string"||!word) continue; 
        const first=word[0]; 
        if (!wordMap[first]) wordMap[first]=[]; 
        if (!wordMap[first].includes(word)) wordMap[first].push(word);
      } 
    },
  };
})();

// BEGIN browser/kkutu-engine.js
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
      }
    }

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

    if (g.DOM?.isChatDisconnected?.()) {
      log('WebSocket disconnected. Pausing for 5 seconds...');
      state.tickInterval = 5000;
      setTimeout(() => {
        state.tickInterval = 3000;
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

// Bundle loading verification
(function() {
  try {
    const g = window.KkutuBot;
    if (!g) {
      console.error('[KkutuBot] Failed to load: KkutuBot not defined');
      return;
    }
    
    const modules = ['DOM', 'Dict', 'WordList', 'Engine'];
    const missing = modules.filter(m => !g[m]);
    
    if (missing.length > 0) {
      console.warn(`[KkutuBot] Missing modules: ${missing.join(', ')}`);
    } else {
      console.log('[KkutuBot] ✓ All modules loaded successfully');
      console.log('[KkutuBot] Ready: KkutuBot.Engine.start()');
    }
  } catch (err) {
    console.error('[KkutuBot] Bundle verification failed:', err.message);
  }
})();
