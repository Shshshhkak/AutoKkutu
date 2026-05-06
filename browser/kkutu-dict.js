(function () {
  // Site dictionary validation for kkutu.co.kr.
  // The bot continuously checks its candidate words with the site's own /o/dict endpoint.
  // 캐싱과 동시성 제어로 API 오버로드 방지.
  const g = window.KkutuBot = window.KkutuBot || {};
  if (g.Dict) return;

  const cache = new Map(); // 단어 검증 캐시
  let pendingRequests = 0;
  const maxConcurrentRequests = 3; // 동시 요청 최대 수
  const requestQueue = [];

  async function fetchWord(word) {
    const safe = encodeURIComponent(String(word || '').trim());
    if (!safe) {
      return { valid: false, data: { error: 400 } };
    }

    // 캐시 확인 - 이미 확인한 단어면 즉시 반환
    if (cache.has(safe)) {
      return cache.get(safe);
    }

    // 동시 요청 제한 - 대기열에 추가
    return new Promise((resolve) => {
      const executeRequest = async () => {
        pendingRequests++;
        
        const url = `/o/dict/${safe}?lang=ko`;
        try {
          const response = await fetch(url, {
            credentials: 'same-origin',
            headers: {
              'X-Requested-With': 'XMLHttpRequest',
              'Accept': 'application/json, text/javascript, */*; q=0.01'
            }
          });
          const data = await response.json();
          const result = (data && data.error) 
            ? { valid: false, data } 
            : { valid: true, data };
          cache.set(safe, result);
          resolve(result);
        } catch (error) {
          // 네트워크 오류 - 안전하게 처리 (단어는 유효하지 않은 것으로 처리)
          const result = { valid: false, error };
          cache.set(safe, result);
          resolve(result);
        } finally {
          pendingRequests--;
          // 대기 중인 요청이 있으면 처리
          if (requestQueue.length > 0) {
            const nextRequest = requestQueue.shift();
            nextRequest();
          }
        }
      };

      if (pendingRequests < maxConcurrentRequests) {
        executeRequest();
      } else {
        requestQueue.push(executeRequest);
      }
    });
  }

  g.Dict = {
    async lookupWord(word) {
      return fetchWord(word);
    },

    async isValidWord(word) {
      const result = await fetchWord(word);
      return result.valid;
    },

    // 캐시 초기화 (필요시)
    clearCache() {
      cache.clear();
      console.log('[KkutuBot.Dict] Cache cleared.');
    },

    // 통계 정보
    getCacheStats() {
      return {
        cachedWords: cache.size,
        pendingRequests: pendingRequests,
        queuedRequests: requestQueue.length,
      };
    },
  };
})();
