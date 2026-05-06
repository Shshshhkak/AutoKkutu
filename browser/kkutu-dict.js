(function () {
  // Site dictionary validation for kkutu.co.kr.
  // The bot continuously checks its candidate words with the site's own /o/dict endpoint.
  const g = window.KkutuBot = window.KkutuBot || {};
  if (g.Dict) return;

  async function fetchWord(word) {
    const safe = encodeURIComponent(String(word || '').trim());
    if (!safe) {
      return { valid: false, data: { error: 400 } };
    }

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
      if (data && data.error) {
        return { valid: false, data };
      }
      return { valid: true, data };
    } catch (error) {
      return { valid: false, error };
    }
  }

  g.Dict = {
    async lookupWord(word) {
      return fetchWord(word);
    },

    async isValidWord(word) {
      const result = await fetchWord(word);
      return result.valid;
    },
  };
})();
