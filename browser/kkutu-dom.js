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
