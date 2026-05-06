(function () {
  const g = window.KkutuBot = window.KkutuBot || {};

  g.DOM = {
    // [1] 진짜 입력창 정밀 타격 (ID: UserMassage... )
    getChatBox() {
      return Array.from(document.querySelectorAll('input')).find(el => 
        el.id.includes('Massage') && el.offsetParent !== null
      );
    },

    // [2] 최후의 입력 우회 기술
    sendWord(word) {
      const chat = this.getChatBox();
      const button = document.querySelector('#ChatBtn') || document.querySelector('.btn-send');
      if (!chat) return;

      const wordStr = String(word).trim();
      
      // 포커스를 주고 클릭 이벤트를 발생시켜 가상 키보드 상태를 유도
      chat.focus();
      chat.click();

      // [핵심] 끄투의 MutationObserver를 속이기 위해 value를 직접 건드리지 않고
      // 브라우저의 '데이터 입력' 이벤트를 순차적으로 시뮬레이션합니다.
      chat.value = ""; // 초기화
      
      // 텍스트 삽입 시도 (가장 강력한 방법)
      try {
        if (!document.execCommand('insertText', false, wordStr)) {
            throw new Error('execCommand failed');
        }
      } catch (e) {
        // execCommand가 막혔을 때: 클립보드 이벤트를 흉내내어 값 주입
        chat.value = wordStr;
      }

      // 서버가 "사람이 쳤다"고 인식하게 만드는 필수 이벤트 셋트
      const eventOptions = { bubbles: true, cancelable: true, composed: true };
      chat.dispatchEvent(new InputEvent('beforeinput', eventOptions));
      chat.dispatchEvent(new InputEvent('input', eventOptions));
      chat.dispatchEvent(new Event('change', eventOptions));

      // [3] 전송: 엔터키 + 버튼 클릭
      setTimeout(() => {
        const enter = new KeyboardEvent('keydown', {
          ...eventOptions, key: 'Enter', code: 'Enter', keyCode: 13, which: 13
        });
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
