(function () {
  const g = window.KkutuBot = window.KkutuBot || {};

  g.Engine = {
    running: false,
    tick() {
      if (!this.running) return;

      const currentWord = g.DOM.getPresentWord();
      
      if (currentWord && g.DOM.isMyTurn()) {
        const lastChar = currentWord.charAt(currentWord.length - 1);
        
        // WordList 파일에 단어가 있는지 확인
        if (g.WordList && typeof g.WordList.getCandidates === 'function') {
          const candidates = g.WordList.getCandidates(lastChar);
          if (candidates && candidates.length > 0) {
            console.log('[KkutuBot] 입력 단어:', candidates[0]);
            g.DOM.sendWord(candidates[0]);
          }
        } else {
          console.error('[KkutuBot] WordList를 찾을 수 없거나 형식이 잘못되었습니다.');
        }
      }
      
      // 2.5초마다 체크 (너무 빠르면 매크로 방지에 걸림)
      setTimeout(() => this.tick(), 2500);
    },
    start() {
      this.running = true;
      console.log('%c[KkutuBot] 봇이 시작되었습니다.', 'color: green; font-weight: bold;');
      this.tick();
    },
    stop() {
      this.running = false;
      console.log('%c[KkutuBot] 봇이 중지되었습니다.', 'color: red; font-weight: bold;');
    }
  };
})();
