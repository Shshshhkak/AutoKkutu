(async () => {
  try {
    const url = 'https://raw.githubusercontent.com/hsheric0210/AutoKkutu/v1.2/browser/kkutu-bundle.js';
    const resp = await fetch(url, { cache: 'no-store' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}: 파일 없음`);
    const code = await resp.text();
    if (!code || code.length < 1000) throw new Error('불완전한 파일');
    Function(code)();
    console.log('✓ KkutuBot이 로드되었습니다. 시작: KkutuBot.Engine.start()');
  } catch (err) {
    console.error('✗ 로드 실패:', err.message);
  }
})();
