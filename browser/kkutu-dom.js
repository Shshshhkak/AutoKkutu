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
      chat.focus();
      chat.value = String(word);
      ['input', 'change'].forEach(type => chat.dispatchEvent(new Event(type, { bubbles: true })));
      button.click();
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

    cleanWord,
  };
})();
