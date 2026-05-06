(function () {
  const g = window.KkutuBot = window.KkutuBot || {};

  g.DOM = {
    // [1] 진짜 입력창 정밀 타격 (함정 ID 회피)
    getChatBox() {
      // 끄투 안티치트가 UserMessage(가짜)와 UserMassage(진짜)를 섞어놓음
      return Array.from(document.querySelectorAll('input')).find(el => 
        el.id.includes('Massage') && el.offsetParent !== null
      );
    },

    // [2] AutoKkutu 스타일의 정밀 입력 시퀀스
    sendWord(word) {
      const chat = this.getChatBox();
      const button = document.querySelector('#ChatBtn') || document.querySelector('.btn-send');
      if (!chat) return;

      const wordStr = String(word).trim();
      chat.focus();

      // [우회] 끄투의 value 감시를 피하기 위한 이벤트 시퀀스
      const options = { bubbles: true, cancelable: true, composed: true };

      // 1. 입력 시작 선언 (한글 조합 시작 시뮬레이션)
      chat.dispatchEvent(new CompositionEvent('compositionstart', options));
      
      // 2. 값 주입 (execCommand가 가장 안전하며, 안될 경우만 value 사용)
      chat.value = ''; 
      if (!document.execCommand('insertText', false, wordStr)) {
          chat.value = wordStr;
      }

      // 3. 입력 중 및 변경 이벤트
      chat.dispatchEvent(new InputEvent('input', { ...options, inputType: 'insertText', data: wordStr }));
      chat.dispatchEvent(new Event('change', options));

      // 4. 입력 종료 선언 (한글 조합 완료)
      chat.dispatchEvent(new CompositionEvent('compositionend', { ...options, data: wordStr }));

      // [3] 전송 (지연 시간을 두어 감시 서버의 타이밍 체크 우회)
      setTimeout(() => {
        const enter = new KeyboardEvent('keydown', {
          ...options, key: 'Enter', code: 'Enter', keyCode: 13, which: 13
        });
        chat.dispatchEvent(enter);
        
        // 버튼 클릭은 최후의 수단으로 실행
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
