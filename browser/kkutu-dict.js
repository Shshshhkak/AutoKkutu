(function () {
  // Site dictionary validation for kkutu.co.kr.
  // The bot checks candidate words with the site's own /o/dict endpoint.
  // 캐싱, 동시성 제어, 타임아웃으로 안정적으로 작동
  const g = window.KkutuBot = window.KkutuBot || {};
  if (g.Dict) return;

  const cache = new Map(); // 단어 검증 캐시
  let pendingRequests = 0;
  const maxConcurrentRequests = 2; // 동시 요청 최대 수 (서버 부하 방지)
  const requestQueue = [];
  const REQUEST_TIMEOUT = 8000; // 8초 제한시간

  function withTimeout(promise, timeoutMs) {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
  }

  async function fetchWord(word) {
    const safe = String(word || '').trim();
    if (!safe || safe.length === 0) {
      return { valid: false, data: { error: 'empty word' } };
    }

    // 캐시 확인 - 이미 확인한 단어면 즉시 반환
    if (cache.has(safe)) {
      return cache.get(safe);
    }

    // 동시 요청 제한 - 대기열에 추가
    return new Promise((resolve) => {
      const executeRequest = async () => {
        pendingRequests++;

        try {
          // 여러 가능한 API 경로 시도 (fallback)
          const urls = [
            `/o/dict/${encodeURIComponent(safe)}?lang=ko`,
            `/api/dict/${encodeURIComponent(safe)}`,
            `https://kkutu.co.kr/o/dict/${encodeURIComponent(safe)}?lang=ko`,
          ];

          let response;
          let lastError;

          for (const url of urls) {
            try {
              response = await withTimeout(
                fetch(url, {
                  credentials: 'include',
                  method: 'GET',
                  headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Language': 'ko-KR,ko;q=0.9',
                    'X-Requested-With': 'XMLHttpRequest',
                    'User-Agent':
                      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                  },
                }),
                REQUEST_TIMEOUT
              );

              if (response.ok) {
                break;
              }
            } catch (error) {
              lastError = error;
              continue;
            }
          }

          if (!response || !response.ok) {
            throw lastError || new Error('All API endpoints failed');
          }

          const contentType = response.headers.get('content-type');
          let data;

          if (contentType && contentType.includes('application/json')) {
            data = await response.json();
          } else {
            const text = await response.text();
            try {
              data = JSON.parse(text);
            } catch {
              data = { raw: text };
            }
          }

          // 응답 분석
          const valid = isValidResponse(data);
          const result = { valid, data };
          cache.set(safe, result);
          resolve(result);
        } catch (error) {
          // 네트워크/타임아웃 오류 - 일단 유효하지 않은 것으로 처리
          const result = { valid: false, error: error.message };
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

  function isValidResponse(data) {
    // kkutu 서버의 응답 형식 분석
    if (!data) return false;
    if (data.error || data.code === 'E') return false; // 에러 응답
    if (data.code === 0 || data.m === null) return false; // 해석 불가
    if (data.m && (data.m.length > 0 || data.data)) return true; // 유효한 단어
    return Object.keys(data).length > 0 && !('error' in data); // 기본 응답이 있으면 유효
  }

  g.Dict = {
    async lookupWord(word) {
      return fetchWord(word);
    },

    async isValidWord(word) {
      const result = await fetchWord(word);
      return result.valid;
    },

    // 캐시 초기화
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
