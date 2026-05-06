(function () {
  const g = window.KkutuBot = window.KkutuBot || {};

  g.DOM = {
    // 1. 진짜 채팅창(Massage) 정밀 타격
    getChatBox() {
      const inputs = Array.from(document.querySelectorAll('input'));
      // 스펠링 함정을 피하기 위해 'Massage'가 포함된 요소 중 실제로 보이는 것만 필터링
      return inputs.find(el => 
        el.id.includes('Massage') && 
        el.offsetParent !== null && 
        window.getComputedStyle(el).display !== 'none'
      );
    },

    // 2. MutationObserver 및 붙여넣기 감지 우회 입력
    sendWord(word) {
      const chat = this.getChatBox();
      if (!chat) return;

      const wordStr = String(word).trim();
      
      // 포커스 및 초기화
      chat.focus();
      chat.value = ''; 

      try {
        // [핵심 우회] execCommand는 사용자의 직접 입력과 동일한 경로로 처리되어 
        // value 감시(MutationObserver)를 피할 수 있습니다.
        document.execCommand('insertText', false, wordStr);
      } catch (e) {
        // execCommand 실패 시 최후의 수단 (이벤트 강제 발생)
        chat.value = wordStr;
        chat.dispatchEvent(new Event('input', { bubbles: true }));
      }

      // 3. 엔터키 시뮬레이션 (서버 전송을 위한 이벤트 트리거)
      setTimeout(() => {
        const events = [
          new KeyboardEvent('keydown', { bubbles: true, key: 'Enter', code: 'Enter', keyCode: 13 }),
          new KeyboardEvent('keypress', { bubbles: true, key: 'Enter', code: 'Enter', keyCode: 13 }),
          new KeyboardEvent('keyup', { bubbles: true, key: 'Enter', code: 'Enter', keyCode: 13 })
        ];
        
        events.forEach(evt => chat.dispatchEvent(evt));

        // 전송 버튼 보조 클릭
        const btn = document.querySelector('#ChatBtn') || document.querySelector('.btn-send');
        if (btn) btn.click();
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
