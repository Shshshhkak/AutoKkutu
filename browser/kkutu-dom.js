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

      // (1) 한글 입력 시작 알림
      chat.dispatchEvent(new CompositionEvent('compositionstart', options));
      
      // (2) 데이터 직접 주입 (MutationObserver 감시를 피하기 위해 execCommand 우선 사용)
      chat.value = ''; 
      try {
        if (!document.execCommand('insertText', false, wordStr)) {
          throw 'execCommand block';
        }
      } catch (e) {
        // execCommand 차단 시 강제 대입 후 input 이벤트 강제 발생
        chat.value = wordStr;
      }

      // (3) 입력 중 및 변경 인식 시키기
      chat.dispatchEvent(new InputEvent('input', { ...options, inputType: 'insertText', data: wordStr }));
      chat.dispatchEvent(new Event('change', options));

      // (4) 한글 입력 종료 알림
      chat.dispatchEvent(new CompositionEvent('compositionend', { ...options, data: wordStr }));

      // (5) 전송 (기계적인 느낌을 지우기 위해 약간의 지연 후 엔터)
      setTimeout(() => {
        const enter = new KeyboardEvent('keydown', {
          ...options, key: 'Enter', code: 'Enter', keyCode: 13, which: 13
        });
        chat.dispatchEvent(enter);
        if (button) button.click();
      }, 150);
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
