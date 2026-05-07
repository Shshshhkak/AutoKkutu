(function () {
  const g = window.KkutuBot = window.KkutuBot || {};

  g.DOM = {
    // 1. 진짜 입력창 정밀 타격 (UserMassage... 함정 회피)
    getChatBox() {
      const inputs = Array.from(document.querySelectorAll('input'));
      return inputs.find(el => el.id.includes('Massage') && el.offsetParent !== null);
    },

    // 2. 물리적 입력 시뮬레이션 (AutoKkutu 방식 채택)
    sendWord(word) {
      const chat = this.getChatBox();
      const button = document.querySelector('#ChatBtn') || document.querySelector('.btn-send');
      if (!chat) return;

      const wordStr = String(word).trim();
      chat.focus();
      chat.value = '';

      // [우회 핵심] 각 문자마다 keydown/keyup 이벤트를 발생시켜
      // 서버의 keyup 카운트 검증을 우회 (입력 문자 수 == keyup 이벤트 수)
      const options = { bubbles: true, cancelable: true, composed: true };
      let charIndex = 0;

      const addCharWithDelay = () => {
        if (charIndex >= wordStr.length) {
          // 모든 문자 입력 완료 후 전송
          setTimeout(() => {
            const enter = new KeyboardEvent('keydown', {
              ...options, key: 'Enter', code: 'Enter', keyCode: 13, which: 13
            });
            chat.dispatchEvent(enter);
            if (button) button.click();
          }, 150);
          return;
        }

        const char = wordStr[charIndex];
        const charCode = char.charCodeAt(0);

        // keydown 이벤트 (keyCode와 which 필수 - 서버가 이를 검증)
        const keydownEvent = new KeyboardEvent('keydown', {
          key: char,
          code: 'Key' + char.toUpperCase(),
          keyCode: charCode,
          which: charCode,
          bubbles: true,
          cancelable: true,
          composed: true
        });
        chat.dispatchEvent(keydownEvent);

        // 값 변경 (한글 조합 방식)
        chat.value += char;

        // input 이벤트
        chat.dispatchEvent(new InputEvent('input', { 
          ...options, 
          inputType: 'insertText', 
          data: char 
        }));

        // keyup 이벤트 (keyCode와 which를 반드시 포함 - 서버가 이를 검증)
        const keyupEvent = new KeyboardEvent('keyup', {
          key: char,
          code: 'Key' + char.toUpperCase(),
          keyCode: charCode,
          which: charCode,
          bubbles: true,
          cancelable: true,
          composed: true
        });
        chat.dispatchEvent(keyupEvent);

        charIndex++;
        // 다음 문자 처리 (자연스러운 타이핑 속도: 30ms)
        setTimeout(addCharWithDelay, 30);
      };

      // 첫 번째 문자 처리 시작
      addCharWithDelay();
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
