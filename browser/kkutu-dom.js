(function () {
  const g = window.KkutuBot = window.KkutuBot || {};

  g.DOM = {
    // [보안 우회] 진짜 채팅창(Massage)을 정확히 찾습니다.
    getChatBox() {
      const inputs = Array.from(document.querySelectorAll('input'));
      // ID에 'Massage'가 포함된 것이 진짜입니다. (Message는 함정)
      return inputs.find(el => el.id.includes('Massage') && el.offsetParent !== null);
    },

    // [보안 우회] 물리적 타이핑 시뮬레이션
    sendWord(word) {
      const chat = this.getChatBox();
      const button = document.querySelector('#ChatBtn') || document.querySelector('.btn-send');
      if (!chat) return;

      chat.focus();
      
      // 1. 기존 값 강제 초기화 및 value 설정
      const wordStr = String(word).trim();
      
      // 2. execCommand를 사용하여 브라우저가 직접 텍스트를 입력하게 함 (감시 우회용)
      // 이 방법은 MutationObserver 감시를 피할 수 있는 가장 강력한 방법입니다.
      chat.value = ''; 
      document.execCommand('insertText', false, wordStr);

      // 3. 만약 위 방법이 안 먹힐 경우를 대비한 표준 이벤트 발생
      const inputEvent = new InputEvent('input', { bubbles: true, inputType: 'insertText', data: wordStr });
      chat.dispatchEvent(inputEvent);

      // 4. 엔터키 시뮬레이션 (약간의 시간차)
      setTimeout(() => {
        const enter = new KeyboardEvent('keydown', { bubbles: true, key: 'Enter', code: 'Enter', keyCode: 13 });
        chat.dispatchEvent(enter);
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
