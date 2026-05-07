(function () {
  // 게임 모드별 단어 선택 전략
  const g = window.KkutuBot = window.KkutuBot || {};
  if (g.Strategy) return;

  // 끄투의 특수 단어 특성
  const wordTraits = {
    // 긴 단어: 40글자 이상
    isLongWord(word) {
      return word && word.length >= 40;
    },

    // 한방 단어: 일반적으로 짧고 끝나기 어려운 글자로 끝나는 단어
    // 예: "힝", "흠", "으", "긔" 등으로 시작하는 단어
    isOneShotWord(word) {
      if (!word || word.length < 2) return false;
      const lastChar = word[word.length - 1];
      const oneShhotEndings = ['힝', '흠', '으', '긔', '읍', '앍', '윽', '웍', '힢'];
      return oneShhotEndings.includes(lastChar);
    },

    // 미션 단어: 특정 패턴 (예: 중간에 같은 글자 반복, 특별한 구조)
    isMissionWord(word) {
      if (!word || word.length < 3) return false;
      // 간단한 미션: 같은 글자가 2번 이상 반복되는 단어
      const charMap = {};
      for (const char of word) {
        charMap[char] = (charMap[char] || 0) + 1;
      }
      return Object.values(charMap).some(count => count >= 2);
    },

    // 종합 점수 계산 (높을수록 좋은 선택지)
    getScore(word, modes) {
      let score = 0;

      if (modes.includes('longWord') && this.isLongWord(word)) {
        score += 1000; // 긴 단어 우선도 최고
      }

      if (modes.includes('oneShot') && this.isOneShotWord(word)) {
        score += 800;  // 한방 단어
      }

      if (modes.includes('mission') && this.isMissionWord(word)) {
        score += 500;  // 미션 단어
      }

      // 기본 점수: 길이 가산
      score += word.length * 10;

      return score;
    },
  };

  g.Strategy = {
    /**
     * 게임 모드에 맞는 최적의 단어를 선택
     * @param {Array} candidates - 후보 단어 배열
     * @param {Array} modes - 활성화된 게임 모드 배열
     * @param {Set} usedWords - 이미 사용한 단어 집합
     * @returns {string|null} 선택된 단어
     */
    selectBestWord(candidates, modes, usedWords = new Set()) {
      if (!candidates || candidates.length === 0) return null;

      // 사용하지 않은 단어만 필터링
      const available = candidates.filter(w => !usedWords.has(w));
      if (available.length === 0) return candidates[0];

      // 선택된 모드가 없으면 기본 동작
      if (!modes || modes.length === 0) {
        return available[0];
      }

      // 각 단어에 점수 계산
      const scored = available.map(word => ({
        word,
        score: wordTraits.getScore(word, modes),
      }));

      // 점수순 정렬
      scored.sort((a, b) => b.score - a.score);

      // 점수가 같으면 길이순으로 정렬 (긴 단어 우선)
      if (scored.length > 1 && scored[0].score === scored[1].score) {
        scored.sort((a, b) => b.word.length - a.word.length);
      }

      return scored[0].word;
    },

    /**
     * 특정 시작 글자에 맞는 단어를 모드별로 필터링
     * @param {Array} candidates - 후보 단어 배열
     * @param {Array} modes - 게임 모드
     * @returns {Array} 필터링된 단어 배열
     */
    filterByMode(candidates, modes) {
      if (!modes || modes.length === 0) return candidates;

      return candidates.filter(word => {
        // 모드 중 하나라도 매칭되면 포함
        if (modes.includes('longWord') && wordTraits.isLongWord(word)) {
          return true;
        }
        if (modes.includes('oneShot') && wordTraits.isOneShotWord(word)) {
          return true;
        }
        if (modes.includes('mission') && wordTraits.isMissionWord(word)) {
          return true;
        }
        return false;
      });
    },

    /**
     * 디버그용 단어 분석
     */
    analyzeWord(word) {
      return {
        word,
        length: word.length,
        isLongWord: wordTraits.isLongWord(word),
        isOneShot: wordTraits.isOneShotWord(word),
        isMission: wordTraits.isMissionWord(word),
      };
    },

    /**
     * 통계: 후보 단어들의 특성 분석
     */
    analyzePool(candidates) {
      const stats = {
        total: candidates.length,
        longWords: candidates.filter(w => wordTraits.isLongWord(w)).length,
        oneShotWords: candidates.filter(w => wordTraits.isOneShotWord(w)).length,
        missionWords: candidates.filter(w => wordTraits.isMissionWord(w)).length,
        avgLength: candidates.reduce((sum, w) => sum + w.length, 0) / candidates.length,
      };
      return stats;
    },
  };
})();
