(function () {
  const g = window.KkutuBot = window.KkutuBot || {};
  if (g.Engine) return;

  g.Engine = {
    running: false,
    async tick() {
      if (!this.running) return;

      const currentWord = g.DOM.getPresentWord();
      // 내 차례이고 단어가 있을 때만 실행
      if (currentWord && g.DOM.isMyTurn()) {
        const lastChar = currentWord.charAt(currentWord.length - 1);
        
        // WordList 파일에서 단어 가져오기
        if (g.WordList) {
          const candidates = g.WordList.getCandidates(lastChar);
          if (candidates && candidates.length > 0) {
            g.DOM.sendWord(candidates[0]);
          }
        }
      }
      // 2초마다 체크 (너무 빠르면 감지될 수 있음)
      setTimeout(() => this.tick(), 2000);
    },
    start() {
      this.running = true;
      console.log('봇 시작');
      this.tick();
    },
    stop() {
      this.running = false;
      console.log('봇 중지');
    }
  };
})();
