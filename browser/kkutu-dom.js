(function () {
  // Browser DOM helpers for kkutu.co.kr game pages.
  // These functions read the current game state and submit chat input.
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

  function cleanWord(input) {
    return String(input || '')
      .trim()
      .replace(/[\n\r\t]/g, '')
      .replace(/[^\uAC00-\uD7A3a-zA-Z0-9ㄱ-ㅎ\s]/g, '')
      .trim();
  }

  g.DOM = {
    getGameMode() {
      const node = $('.room-head-mode');
      const text = safeText(node);
      if (!text) return '';
      const parts = text.split('/')[0]?.trim();
      return parts ? parts.replace(/^\s*[^\s]*\s*/, '') : '';
    },

    getPresentWord() {
      const display = $('.jjo-display.ellipse') || $('.jjo-display');
      return cleanWord(safeText(display));
    },

    getWordLength() {
      const node = $('.jjo-display-word-length');
      const text = safeText(node);
      if (!text) return 0;
      const match = text.match(/\d+/);
      return match ? Number(match[0]) : 0;
    },

    isMyTurn() {
      const input = $('.game-input');
      return Boolean(input && isVisible(input));
    },

    getTurnError() {
      return safeText($('.game-fail-text'));
    },

    getTurnTime() {
      const node = document.querySelector(".graph.jjo-turn-time > .graph-bar");
      const text = safeText(node);
      if (!text) return '';
      return text.replace(/\D+$/, '');
    },

    getRoundTime() {
      const node = document.querySelector(".graph.jjo-round-time > .graph-bar");
      const text = safeText(node);
      if (!text) return '';
      return text.replace(/\D+$/, '');
    },

    getWordHistory() {
      return $all('.ellipse.history-item.expl-mother').map(v => cleanWord(safeText(v.childNodes[0]))).filter(Boolean);
    },

    getChatBox() {
      return $('#Talk');
    },

    sendWord(word) {
      const chat = this.getChatBox();
      const button = $('#ChatBtn');
      if (!chat || !button) {
        throw new Error('Chat input or submit button not found on this page.');
      }
      
      const wordStr = String(word);
      chat.focus();
      
      // 클립보드 API를 사용한 자연스러운 paste 이벤트 시뮬레이션
      // 또는 keydown/keyup을 포함해서 더 자연스럽게 보이도록
      
      // 1단계: beforeinput 이벤트 (선택적이지만 일부 사이트에서 감지)
      const beforeInputEvent = new Event('beforeinput', { bubbles: true, cancelable: true });
      chat.dispatchEvent(beforeInputEvent);
      
      // 2단계: 값 변경
      chat.value = wordStr;
      
      // 3단계: 자연스러운 input/change/keyup 이벤트 발생
      ['input', 'change', 'keyup'].forEach(type => {
        const evt = new Event(type, { bubbles: true, cancelable: true });
        chat.dispatchEvent(evt);
      });
      
      // 4단계: 버튼 클릭 (약간의 지연을 추가해서 더 자연스럽게)
      setTimeout(() => {
        button.click();
      }, 50);
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
      return Boolean($('.jjo-display.ellipse') || $('.room-head-mode') || $('#Talk'));
    },

    isChatDisconnected() {
      const disconnectNotice = $('.chat-disconnect') || $('.socket-error-message');
      return Boolean(disconnectNotice && isVisible(disconnectNotice));
    },

    cleanWord,
  };
})();
