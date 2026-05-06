(function () {
  const g = window.KkutuBot = window.KkutuBot || {};

  g.DOM = {
    // 진짜 입력창 찾기: ID에 'Massage'(마사지)가 포함된 것이 진짜입니다.
    getChatBox() {
      const inputs = Array.from(document.querySelectorAll('input'));
      // 1순위: 'Massage' 스펠링을 가진 활성화된 입력창
      let realInput = inputs.find(el => 
        el.id.includes('Massage') && el.offsetParent !== null
      );

      // 2순위: 1순위가 없을 경우 일반적인 게임 입력창
      if (!realInput) {
        realInput = document.querySelector('#Talk') || 
                    document.querySelector('.game-input') ||
                    inputs.find(el => el.placeholder && el.offsetParent !== null);
      }
      return realInput;
    },

    sendWord(word) {
      let chat = this.getChatBox();
      const button = document.querySelector('#ChatBtn') || document.querySelector('.btn-send');

      if (!chat) return;

      // jQuery 객체인 경우 원본 추출 (dispatchEvent 에러 방지)
      if (window.jQuery && chat instanceof window.jQuery) chat = chat[0];
      
      const wordStr = String(word).trim();
      chat.focus();

      // [핵심] 단순 할당이 아닌 이벤트를 순차적으로 발생시켜 감시 우회
      chat.value = wordStr;
      
      const events = ['input', 'change'];
      events.forEach(name => {
        const e = document.createEvent('HTMLEvents');
        e.initEvent(name, true, true);
        chat.dispatchEvent(e);
      });

      // 엔터키 입력 시뮬레이션
      const enter = new KeyboardEvent('keydown', {
        bubbles: true, cancelable: true, key: 'Enter', keyCode: 13
      });
      chat.dispatchEvent(enter);

      // 서버가 매크로로 판단하지 않도록 약간의 지연 후 클릭
      setTimeout(() => { if (button) button.click(); }, 100);
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
