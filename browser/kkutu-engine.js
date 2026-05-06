(function () {
  const g = window.KkutuBot = window.KkutuBot || {};

  g.Engine = {
    running: false,
    tick() {
      if (!this.running) return;

      const currentWord = g.DOM.getPresentWord();
      
      if (currentWord && g.DOM.isMyTurn()) {
        const lastChar = currentWord.charAt(currentWord.length - 1);
        
        // WordList가 로드되어 있는지 확인
        if (g.WordList && g.WordList.getCandidates) {
          const candidates = g.WordList.getCandidates(lastChar);
          if (candidates && candidates.length > 0) {
            // 이미 사용한 단어 제외 로직이 WordList에 없다면 첫 번째 단어 사용
            g.DOM.sendWord(candidates[0]);
          }
        }
      }
      
      // 체크 간격 (너무 빠르면 감지되므로 2~3초 권장)
      setTimeout(() => this.tick(), 2500);
    },
    start() {
      this.running = true;
      console.log('[KkutuBot] 실행 중...');
      this.tick();
    },
    stop() {
      this.running = false;
      console.log('[KkutuBot] 정지됨.');
    }
  };
})();
