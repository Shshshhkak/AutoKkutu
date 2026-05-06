(function () {
  const g = window.KkutuBot = window.KkutuBot || {};

  g.DOM = {
    // [핵심 수정] 진짜 채팅창 찾기 로직
    getChatBox() {
      // 1. ID에 'Massage'가 포함된 input을 찾음 (끄투 함정 역이용)
      const allInputs = Array.from(document.querySelectorAll('input'));
      let realInput = allInputs.find(el => 
        el.id.includes('Massage') && el.offsetParent !== null
      );

      // 2. 만약 없다면, 화면에 보이고 placeholder가 있는 input을 찾음
      if (!realInput) {
        realInput = allInputs.find(el => 
          el.offsetParent !== null && 
          (el.placeholder || el.className.includes('chat') || el.id.includes('Talk'))
        );
      }
      return realInput;
    },

    // 단어를 입력하고 엔터를 치는 동작
    sendWord(word) {
      const chat = this.getChatBox();
      const button = document.querySelector('#ChatBtn') || document.querySelector('.btn-send');

      if (!chat) {
        console.error('[KkutuBot] 채팅창을 찾지 못했습니다.');
        return;
      }

      const wordStr = String(word).trim();
      chat.focus();
      
      // [해결] 단순 chat.value 할당 대신 이벤트 발생
      chat.value = wordStr;

      // React나 Vue 환경에서도 인식되도록 표준 이벤트 발생
      const evts = ['input', 'change'];
      evts.forEach(name => {
        const e = document.createEvent('HTMLEvents');
        e.initEvent(name, true, true);
        chat.dispatchEvent(e);
      });

      // 엔터키 시뮬레이션
      const enter = new KeyboardEvent('keydown', {
        bubbles: true, cancelable: true, key: 'Enter', keyCode: 13
      });
      chat.dispatchEvent(enter);

      // 전송 버튼 클릭 (약간의 시간차)
      setTimeout(() => { if (button) button.click(); }, 150);
    },

    getPresentWord() {
      const node = document.querySelector('.jjo-display.ellipse') || document.querySelector('.target-word');
      return node ? node.textContent.trim() : '';
    },

    isMyTurn() {
      // 타이머가 보이면 내 차례로 간주 (끄투의 일반적인 구조)
      const timer = document.querySelector('.jjo-timer');
      return timer && window.getComputedStyle(timer).display !== 'none';
    }
  };
})();
      const wordStr = String(word).trim();
      chat.focus();
      chat.value = wordStr;

      // 이벤트 발생 (표준 방식)
      try {
        const inputEvt = document.createEvent('HTMLEvents');
        inputEvt.initEvent('input', true, true);
        chat.dispatchEvent(inputEvt);

        const changeEvt = document.createEvent('HTMLEvents');
        changeEvt.initEvent('change', true, true);
        chat.dispatchEvent(changeEvt);
      } catch (e) {
        console.warn('이벤트 발생 실패, 직접 입력을 시도합니다.');
      }

      // 버튼 클릭
      setTimeout(() => {
        if (button) button.click();
      }, 100);
    },

    getPresentWord() {
      const node = document.querySelector('.jjo-display.ellipse') || document.querySelector('.target-word');
      return node ? node.textContent.trim() : '';
    },

    isMyTurn() {
      const timer = document.querySelector('.jjo-timer');
      return timer && window.getComputedStyle(timer).display !== 'none';
    }
  };
})();
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
