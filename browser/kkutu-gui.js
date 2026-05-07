(function () {
  // GUI 패널 - 게임 모드 선택 및 설정 관리
  const g = window.KkutuBot = window.KkutuBot || {};
  if (g.GUI) return;

  const config = {
    enabled: false,
    modes: {
      longWord: false,      // 긴 단어 (40글자 이상)
      oneShot: false,       // 한방 단어 (공격용)
      mission: false,       // 미션 단어
    },
    minWordLength: 2,
    maxCheckCount: 3,
    autoStart: false,
  };

  function createPanel() {
    // 기존 패널 제거
    const existing = document.getElementById('kkutubot-panel');
    if (existing) existing.remove();

    // 패널 생성
    const panel = document.createElement('div');
    panel.id = 'kkutubot-panel';
    panel.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      z-index: 10000;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: 2px solid #fff;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      color: #fff;
      width: 300px;
      min-height: 200px;
    `;

    // 제목
    const title = document.createElement('h3');
    title.textContent = '🤖 KkutuBot';
    title.style.cssText = 'margin: 0 0 15px 0; font-size: 18px; font-weight: bold;';

    // 토글 스위치 생성 함수
    function createToggle(label, key, onChange) {
      const wrapper = document.createElement('div');
      wrapper.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;
        padding: 8px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 6px;
      `;

      const labelEl = document.createElement('label');
      labelEl.textContent = label;
      labelEl.style.cssText = 'flex: 1; cursor: pointer; font-size: 14px;';

      const toggle = document.createElement('input');
      toggle.type = 'checkbox';
      toggle.checked = config.modes[key] || false;
      toggle.style.cssText = `
        width: 40px;
        height: 24px;
        cursor: pointer;
      `;

      toggle.addEventListener('change', (e) => {
        config.modes[key] = e.target.checked;
        onChange(e.target.checked);
      });

      wrapper.appendChild(labelEl);
      wrapper.appendChild(toggle);
      return wrapper;
    }

    // 게임 모드 섹션
    const modesSection = document.createElement('div');
    modesSection.style.cssText = 'margin-bottom: 15px;';

    const modesTitle = document.createElement('div');
    modesTitle.textContent = '📋 게임 모드';
    modesTitle.style.cssText = 'font-weight: bold; margin-bottom: 8px; font-size: 13px; opacity: 0.9;';
    modesSection.appendChild(modesTitle);

    modesSection.appendChild(createToggle('긴 단어 (40+글자)', 'longWord', () => {
      console.log('[KkutuBot] 긴 단어 모드:', config.modes.longWord);
    }));

    modesSection.appendChild(createToggle('한방/공격 단어', 'oneShot', () => {
      console.log('[KkutuBot] 한방 단어 모드:', config.modes.oneShot);
    }));

    modesSection.appendChild(createToggle('미션 우선', 'mission', () => {
      console.log('[KkutuBot] 미션 모드:', config.modes.mission);
    }));

    // 상태 표시
    const statusSection = document.createElement('div');
    statusSection.style.cssText = `
      margin-bottom: 15px;
      padding: 10px;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 6px;
      font-size: 12px;
    `;

    const statusText = document.createElement('div');
    statusText.id = 'kkutubot-status';
    statusText.textContent = '⏹️ 준비 완료';
    statusText.style.cssText = 'margin-bottom: 5px;';
    statusSection.appendChild(statusText);

    const statsText = document.createElement('div');
    statsText.id = 'kkutubot-stats';
    statsText.textContent = '';
    statsText.style.cssText = 'opacity: 0.8;';
    statusSection.appendChild(statsText);

    // 버튼 그룹
    const buttonGroup = document.createElement('div');
    buttonGroup.style.cssText = `
      display: flex;
      gap: 8px;
      margin-top: 12px;
    `;

    function createButton(text, color, onClick) {
      const btn = document.createElement('button');
      btn.textContent = text;
      btn.style.cssText = `
        flex: 1;
        padding: 8px 12px;
        background: ${color};
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        font-weight: bold;
        transition: all 0.2s;
      `;
      btn.addEventListener('mouseenter', () => {
        btn.style.transform = 'scale(1.05)';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'scale(1)';
      });
      btn.addEventListener('click', onClick);
      return btn;
    }

    const startBtn = createButton('▶ 시작', '#4CAF50', () => {
      if (!g.Engine.status().running) {
        g.Engine.start();
        updateStatus();
      }
    });

    const stopBtn = createButton('⏹ 중지', '#f44336', () => {
      if (g.Engine.status().running) {
        g.Engine.stop();
        updateStatus();
      }
    });

    const collapseBtn = createButton('접기', '#759FFF', () => {
      const content = document.getElementById('kkutubot-content');
      const isHidden = content.style.display === 'none';
      content.style.display = isHidden ? 'block' : 'none';
      collapseBtn.textContent = isHidden ? '접기' : '펼치기';
    });

    buttonGroup.appendChild(startBtn);
    buttonGroup.appendChild(stopBtn);
    buttonGroup.appendChild(collapseBtn);

    // 컨텐츠 래퍼
    const content = document.createElement('div');
    content.id = 'kkutubot-content';
    content.appendChild(modesSection);
    content.appendChild(statusSection);
    content.appendChild(buttonGroup);

    panel.appendChild(title);
    panel.appendChild(content);

    document.body.appendChild(panel);

    return {
      updateStatus,
      panel,
    };
  }

  function updateStatus() {
    const status = g.Engine?.status?.();
    const statusEl = document.getElementById('kkutubot-status');
    const statsEl = document.getElementById('kkutubot-stats');

    if (!statusEl || !statsEl) return;

    if (status?.running) {
      statusEl.textContent = '▶️ 실행 중';
      statusEl.style.color = '#4CAF50';
    } else {
      statusEl.textContent = '⏹️ 중지됨';
      statusEl.style.color = '#f44336';
    }

    if (status) {
      const modeStr = Object.entries(config.modes)
        .filter(([_, v]) => v)
        .map(([k]) => k)
        .join(', ') || '없음';

      statsEl.innerHTML = `
        모드: ${modeStr}<br>
        차례: ${status.turnCount || 0}<br>
        단어 캐시: ${status.dictCache || 0}
      `;
    }
  }

  g.GUI = {
    init() {
      createPanel();
      // 1초마다 상태 업데이트
      setInterval(updateStatus, 1000);
      console.log('[KkutuBot] GUI initialized');
    },

    getConfig() {
      return config;
    },

    updateConfig(newConfig) {
      Object.assign(config, newConfig);
    },

    getEnabledModes() {
      return Object.entries(config.modes)
        .filter(([_, enabled]) => enabled)
        .map(([mode]) => mode);
    },

    hide() {
      const panel = document.getElementById('kkutubot-panel');
      if (panel) panel.style.display = 'none';
    },

    show() {
      const panel = document.getElementById('kkutubot-panel');
      if (panel) panel.style.display = 'block';
    },
  };
})();
