// ==================== CONFIG ====================
const DAILY_GOAL = 8;
const COOLDOWN_MINUTES = 30;
const COINS_PER_CUP = 10;
const STREAK_BONUS = 5; // extra coins per cup when on streak

const TREE_LEVELS = [
  { name: '種子',       minCups: 0,   icon: '🌱' },
  { name: '嫩芽',       minCups: 8,   icon: '🌿' },
  { name: '小樹苗',     minCups: 24,  icon: '🪴' },
  { name: '青年樹',     minCups: 56,  icon: '🌲' },
  { name: '茂盛大樹',   minCups: 112, icon: '🌳' },
  { name: '開花寶樹',   minCups: 200, icon: '🌸' },
  { name: '結果金樹',   minCups: 320, icon: '✨' },
  { name: '傳說發財樹', minCups: 500, icon: '💰' },
];

const FORTUNES = [
  '水到渠成，財運亨通！',
  '潤澤身心，福氣自來。',
  '一杯清水，一分財氣。',
  '身體是最大的資本，你正在投資自己。',
  '堅持灌溉，信念之樹終將結出金果。',
  '每一口水都在為你的好運充能！',
  '水為財，你今天又更富有了。',
  '健康就是最大的財富，你做對了。',
  '滴水穿石，持之以恆必有回報。',
  '你的發財樹感受到了你的誠意！',
  '財神看到了你的堅持，正在趕來的路上。',
  '喝水如修行，修行通財路。',
  '今日的每一滴水，都是明日的一枚金幣。',
  '信念灌溉，黃金花開。',
  '好的習慣就是最穩定的被動收入。',
  '你的自律，就是最強的生財之道。',
];

// ==================== MOOD CONFIG ====================
const MOODS = [
  { key: 'joy',    emoji: '😊', label: '開心' },
  { key: 'calm',   emoji: '😌', label: '平靜' },
  { key: 'grateful', emoji: '🙏', label: '感恩' },
  { key: 'tired',  emoji: '😮‍💨', label: '疲憊' },
  { key: 'anxious',emoji: '😟', label: '焦慮' },
  { key: 'sad',    emoji: '🥲', label: '難過' },
  { key: 'fired',  emoji: '🔥', label: '衝勁' },
];

let selectedMood = null;

// Burn paper config (content is never stored — only a count)
const BURN_COUNT_KEY = 'fortune_tree_burn_count';
let burnInProgress = false;

// ==================== STATE ====================
let state = loadState();

function defaultState() {
  return {
    todayCups: 0,
    todayDate: getTodayStr(),
    totalCups: 0,
    totalCoins: 0,
    streak: 0,
    lastDrinkTime: null,
    log: [],          // [{time, date}]
    lastActiveDate: null,
    moods: [],        // [{id, ts, date, time, mood, text}]
  };
}

function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem('fortune_tree_state'));
    if (s && s.todayDate) {
      if (!Array.isArray(s.moods)) s.moods = [];
      // Check if it's a new day
      if (s.todayDate !== getTodayStr()) {
        return rollOverDay(s);
      }
      return s;
    }
  } catch(e) {}
  return defaultState();
}

function rollOverDay(s) {
  const yesterday = getDateStr(new Date(Date.now() - 86400000));
  // Did they meet goal yesterday?
  if (s.todayCups >= DAILY_GOAL && s.todayDate === yesterday) {
    s.streak = (s.streak || 0) + 1;
  } else if (s.todayDate !== yesterday) {
    // Missed a day
    s.streak = 0;
  }
  s.todayCups = 0;
  s.todayDate = getTodayStr();
  s.log = [];
  s.lastDrinkTime = null;
  s.lastActiveDate = getTodayStr();
  return s;
}

function saveState() {
  localStorage.setItem('fortune_tree_state', JSON.stringify(state));
}

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}
function getDateStr(d) {
  return d.toISOString().slice(0, 10);
}

// ==================== TREE RENDERING ====================
function getTreeLevel(totalCups) {
  let lvl = 0;
  for (let i = TREE_LEVELS.length - 1; i >= 0; i--) {
    if (totalCups >= TREE_LEVELS[i].minCups) { lvl = i; break; }
  }
  return lvl;
}

function drawTree(level, progress) {
  // progress: 0-1 within current level
  const svg = document.getElementById('treeSvg');
  const p = Math.min(1, Math.max(0, progress));

  // Color themes per level
  const themes = [
    { trunk: '#5a3a1a', leaf: '#4a7c3f', accent: '#6abf4b', gold: '#ffd700' },
    { trunk: '#5a3a1a', leaf: '#4a8c3f', accent: '#7acf5b', gold: '#ffd700' },
    { trunk: '#6a4a2a', leaf: '#3a8c3f', accent: '#6abf4b', gold: '#ffe44d' },
    { trunk: '#7a5a3a', leaf: '#2a7c2f', accent: '#5aaf3b', gold: '#ffd700' },
    { trunk: '#8a6a4a', leaf: '#1a6c1f', accent: '#4a9f2b', gold: '#ffcc00' },
    { trunk: '#7a5030', leaf: '#ff88aa', accent: '#ffaacc', gold: '#ffd700' },
    { trunk: '#8a6a3a', leaf: '#ffd700', accent: '#ffaa00', gold: '#fff4b0' },
    { trunk: '#aa8844', leaf: '#ffd700', accent: '#ff8c00', gold: '#fff' },
  ];
  const t = themes[Math.min(level, themes.length - 1)];

  let html = '';

  if (level === 0) {
    // Seed / sprout
    const sproutH = 20 + p * 40;
    html = `
      <ellipse cx="100" cy="260" rx="30" ry="8" fill="#3a2510" opacity="0.5"/>
      <line x1="100" y1="260" x2="100" y2="${260 - sproutH}" stroke="${t.trunk}" stroke-width="3" stroke-linecap="round"/>
      <ellipse cx="${100 - 8}" cy="${260 - sproutH - 5}" rx="8" ry="12" fill="${t.leaf}" transform="rotate(-20, ${100 - 8}, ${260 - sproutH - 5})"/>
      <ellipse cx="${100 + 8}" cy="${260 - sproutH - 3}" rx="7" ry="10" fill="${t.accent}" transform="rotate(20, ${100 + 8}, ${260 - sproutH - 3})"/>
    `;
  } else if (level === 1) {
    // Small plant
    const h = 60 + p * 30;
    html = `
      <ellipse cx="100" cy="260" rx="35" ry="10" fill="#3a2510" opacity="0.4"/>
      <line x1="100" y1="260" x2="100" y2="${260 - h}" stroke="${t.trunk}" stroke-width="5" stroke-linecap="round"/>
      <ellipse cx="80" cy="${260 - h + 10}" rx="18" ry="22" fill="${t.leaf}" opacity="0.9"/>
      <ellipse cx="120" cy="${260 - h + 15}" rx="16" ry="20" fill="${t.accent}" opacity="0.85"/>
      <ellipse cx="100" cy="${260 - h - 5}" rx="20" ry="18" fill="${t.leaf}" opacity="0.95"/>
    `;
  } else if (level <= 3) {
    // Growing tree
    const h = 100 + (level - 2) * 40 + p * 30;
    const w = 5 + level * 2;
    const canopyR = 30 + level * 10 + p * 8;
    html = `
      <ellipse cx="100" cy="262" rx="40" ry="10" fill="#3a2510" opacity="0.3"/>
      <path d="M${100 - w} 260 Q${100 - w - 3} ${260 - h/2} ${100 - 2} ${260 - h}
               L${100 + 2} ${260 - h}
               Q${100 + w + 3} ${260 - h/2} ${100 + w} 260 Z"
            fill="${t.trunk}"/>
      <!-- branches -->
      <line x1="100" y1="${260 - h * 0.6}" x2="${100 - canopyR}" y2="${260 - h * 0.75}" stroke="${t.trunk}" stroke-width="3" stroke-linecap="round"/>
      <line x1="100" y1="${260 - h * 0.5}" x2="${100 + canopyR - 5}" y2="${260 - h * 0.6}" stroke="${t.trunk}" stroke-width="3" stroke-linecap="round"/>
      <!-- canopy -->
      <ellipse cx="${100 - canopyR * 0.5}" cy="${260 - h * 0.8}" rx="${canopyR * 0.7}" ry="${canopyR * 0.6}" fill="${t.leaf}" opacity="0.85"/>
      <ellipse cx="${100 + canopyR * 0.4}" cy="${260 - h * 0.7}" rx="${canopyR * 0.65}" ry="${canopyR * 0.55}" fill="${t.accent}" opacity="0.8"/>
      <ellipse cx="100" cy="${260 - h - 5}" rx="${canopyR * 0.8}" ry="${canopyR * 0.65}" fill="${t.leaf}" opacity="0.9"/>
    `;
    // Add some gold sparkles for level 3
    if (level === 3) {
      for (let i = 0; i < 3; i++) {
        const sx = 70 + Math.random() * 60;
        const sy = 260 - h * 0.7 - Math.random() * 40;
        html += `<circle cx="${sx}" cy="${sy}" r="2" fill="${t.gold}" opacity="${0.4 + p * 0.4}">
          <animate attributeName="opacity" values="${0.3};${0.8};${0.3}" dur="${2 + i}s" repeatCount="indefinite"/>
        </circle>`;
      }
    }
  } else {
    // Majestic tree (level 4-7)
    const h = 180 + (level - 4) * 15;
    const w = 12 + (level - 4) * 2;
    const canopyR = 65 + (level - 4) * 5;
    const isFlower = level === 5;
    const isGold = level >= 6;
    const isLegend = level === 7;

    // Roots
    html = `
      <ellipse cx="100" cy="264" rx="50" ry="12" fill="#3a2510" opacity="0.3"/>
      <path d="M85 260 Q75 268 60 265" stroke="${t.trunk}" stroke-width="3" fill="none" opacity="0.5"/>
      <path d="M115 260 Q125 268 140 265" stroke="${t.trunk}" stroke-width="3" fill="none" opacity="0.5"/>
    `;
    // Trunk
    html += `
      <path d="M${100 - w} 260 Q${100 - w - 5} ${260 - h/2} ${100 - 3} ${260 - h + 20}
               L${100 + 3} ${260 - h + 20}
               Q${100 + w + 5} ${260 - h/2} ${100 + w} 260 Z"
            fill="${t.trunk}"/>
    `;
    // Branches
    const branches = [
      { x: -canopyR * 0.7, y: h * 0.65, w: 4 },
      { x: canopyR * 0.6, y: h * 0.55, w: 3.5 },
      { x: -canopyR * 0.4, y: h * 0.8, w: 3 },
      { x: canopyR * 0.8, y: h * 0.75, w: 3 },
    ];
    branches.forEach(b => {
      html += `<line x1="100" y1="${260 - b.y}" x2="${100 + b.x}" y2="${260 - b.y - 15}" stroke="${t.trunk}" stroke-width="${b.w}" stroke-linecap="round"/>`;
    });
    // Canopy layers
    const layers = [
      { dx: -canopyR * 0.45, dy: h * 0.75, rx: canopyR * 0.55, ry: canopyR * 0.45, fill: t.leaf, op: 0.8 },
      { dx: canopyR * 0.35, dy: h * 0.68, rx: canopyR * 0.5, ry: canopyR * 0.4, fill: t.accent, op: 0.75 },
      { dx: 0, dy: h * 0.85, rx: canopyR * 0.65, ry: canopyR * 0.5, fill: t.leaf, op: 0.85 },
      { dx: -canopyR * 0.2, dy: h * 0.95, rx: canopyR * 0.55, ry: canopyR * 0.45, fill: t.accent, op: 0.8 },
      { dx: canopyR * 0.15, dy: h, rx: canopyR * 0.6, ry: canopyR * 0.48, fill: t.leaf, op: 0.9 },
    ];
    layers.forEach(l => {
      html += `<ellipse cx="${100 + l.dx}" cy="${260 - l.dy}" rx="${l.rx}" ry="${l.ry}" fill="${l.fill}" opacity="${l.op}"/>`;
    });

    // Flowers for level 5
    if (isFlower) {
      const flowers = [[70, 100], [130, 110], [90, 70], [115, 80], [80, 120]];
      flowers.forEach(([fx, fy], i) => {
        html += `<circle cx="${fx}" cy="${fy}" r="5" fill="#ffaacc" opacity="0.9">
          <animate attributeName="r" values="4;6;4" dur="${2 + i * 0.3}s" repeatCount="indefinite"/>
        </circle>`;
        html += `<circle cx="${fx}" cy="${fy}" r="2" fill="#fff" opacity="0.7"/>`;
      });
    }

    // Gold fruits / coins for level 6-7
    if (isGold) {
      const fruits = [[65, 95], [135, 105], [85, 75], [120, 85], [100, 65], [75, 115], [125, 120]];
      const count = isLegend ? 7 : 5;
      fruits.slice(0, count).forEach(([fx, fy], i) => {
        html += `<circle cx="${fx}" cy="${fy}" r="${isLegend ? 7 : 6}" fill="${t.gold}" opacity="0.9">
          <animate attributeName="opacity" values="0.7;1;0.7" dur="${1.5 + i * 0.2}s" repeatCount="indefinite"/>
        </circle>`;
        html += `<text x="${fx}" y="${fy + 4}" text-anchor="middle" font-size="8" fill="#8a5a00">$</text>`;
      });
    }

    // Legend aura
    if (isLegend) {
      html = `<circle cx="100" cy="140" r="90" fill="none" stroke="${t.gold}" stroke-width="1" opacity="0.3">
        <animate attributeName="r" values="85;95;85" dur="3s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.1;0.3;0.1" dur="3s" repeatCount="indefinite"/>
      </circle>` + html;
    }
  }

  svg.innerHTML = html;
}

function getProgressInLevel(totalCups, level) {
  const curr = TREE_LEVELS[level].minCups;
  const next = level < TREE_LEVELS.length - 1 ? TREE_LEVELS[level + 1].minCups : curr + 100;
  return (totalCups - curr) / (next - curr);
}

// ==================== STARS ====================
function createStars() {
  const container = document.getElementById('stars');
  for (let i = 0; i < 40; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    star.style.left = Math.random() * 100 + '%';
    star.style.top = Math.random() * 60 + '%';
    star.style.animationDelay = Math.random() * 3 + 's';
    star.style.width = star.style.height = (1 + Math.random() * 2) + 'px';
    container.appendChild(star);
  }
}

// ==================== DRINK WATER ====================
function drinkWater() {
  if (!canDrink()) return;

  state.todayCups++;
  state.totalCups++;

  // Coins
  const coins = COINS_PER_CUP + (state.streak > 0 ? STREAK_BONUS : 0);
  state.totalCoins += coins;

  // Log
  const now = new Date();
  state.lastDrinkTime = now.getTime();
  state.log.push({
    time: now.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
    cups: state.todayCups,
  });

  saveState();

  // Check level up
  const oldLevel = getTreeLevel(state.totalCups - 1);
  const newLevel = getTreeLevel(state.totalCups);
  if (newLevel > oldLevel) {
    showLevelUp(newLevel);
  }

  // Animations
  spawnCoinParticles(coins);
  const svg = document.getElementById('treeSvg');
  svg.classList.remove('glow-pulse');
  void svg.offsetWidth;
  svg.classList.add('glow-pulse');

  // Show fortune
  showFortune();

  // Update UI
  updateUI();
  startCooldownTimer();
}

function canDrink() {
  if (!state.lastDrinkTime) return true;
  const elapsed = Date.now() - state.lastDrinkTime;
  return elapsed >= COOLDOWN_MINUTES * 60 * 1000;
}

function getRemainingCooldown() {
  if (!state.lastDrinkTime) return 0;
  const elapsed = Date.now() - state.lastDrinkTime;
  const remaining = COOLDOWN_MINUTES * 60 * 1000 - elapsed;
  return Math.max(0, remaining);
}

// ==================== UI UPDATES ====================
function updateUI() {
  document.getElementById('todayCups').textContent = state.todayCups;
  document.getElementById('streak').textContent = state.streak;
  document.getElementById('totalCoins').textContent = state.totalCoins;

  const level = getTreeLevel(state.totalCups);
  document.getElementById('treeLevel').textContent = level + 1;
  document.getElementById('treeName').textContent = TREE_LEVELS[level].name;

  const pct = Math.min(100, Math.round((state.todayCups / DAILY_GOAL) * 100));
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('progressPct').textContent = pct + '%';

  // Tree
  const prog = getProgressInLevel(state.totalCups, level);
  drawTree(level, prog);

  // Button state
  const btn = document.getElementById('drinkBtn');
  if (canDrink()) {
    btn.disabled = false;
    btn.innerHTML = '💧 我喝了一杯水';
  } else {
    btn.disabled = true;
  }

  // Log
  renderLog();
}

function renderLog() {
  const list = document.getElementById('logList');
  if (state.log.length === 0) {
    list.innerHTML = '<div class="log-item">今天還沒喝水喔，快來一杯！</div>';
    return;
  }
  list.innerHTML = state.log.map((item, i) =>
    `<div class="log-item">🕐 ${item.time}　第 ${item.cups} 杯</div>`
  ).reverse().join('');
}

function toggleLog() {
  const list = document.getElementById('logList');
  const toggle = document.getElementById('logToggle');
  list.classList.toggle('open');
  toggle.textContent = list.classList.contains('open') ? '▲ 收起記錄' : '▼ 今日喝水記錄';
}

// ==================== COOLDOWN TIMER ====================
let cooldownInterval = null;

function startCooldownTimer() {
  if (cooldownInterval) clearInterval(cooldownInterval);

  function tick() {
    const remaining = getRemainingCooldown();
    const btn = document.getElementById('drinkBtn');
    const txt = document.getElementById('cooldownText');

    if (remaining <= 0) {
      btn.disabled = false;
      btn.innerHTML = '💧 我喝了一杯水';
      txt.textContent = '可以喝下一杯了！';
      if (cooldownInterval) { clearInterval(cooldownInterval); cooldownInterval = null; }
      return;
    }

    btn.disabled = true;
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    btn.innerHTML = `⏳ 冷卻中 ${mins}:${secs.toString().padStart(2, '0')}`;
    txt.textContent = `每杯間隔 ${COOLDOWN_MINUTES} 分鐘，讓身體好好吸收`;
  }

  tick();
  cooldownInterval = setInterval(tick, 1000);
}

// ==================== COIN PARTICLES ====================
function spawnCoinParticles(count) {
  const scene = document.querySelector('.scene');
  const emojis = ['🪙', '💰', '✨', '$'];
  for (let i = 0; i < Math.min(count, 8); i++) {
    setTimeout(() => {
      const coin = document.createElement('div');
      coin.className = 'coin-particle';
      coin.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      coin.style.left = (30 + Math.random() * 40) + '%';
      coin.style.bottom = (30 + Math.random() * 20) + '%';
      scene.appendChild(coin);
      setTimeout(() => coin.remove(), 2000);
    }, i * 100);
  }
}

// ==================== FORTUNE ====================
function showFortune() {
  const el = document.getElementById('fortuneMsg');
  const msg = FORTUNES[Math.floor(Math.random() * FORTUNES.length)];
  el.textContent = `🧧 ${msg}`;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 4000);
}

// ==================== LEVEL UP ====================
function showLevelUp(level) {
  const overlay = document.getElementById('levelUpOverlay');
  const info = TREE_LEVELS[level];
  document.getElementById('levelUpTitle').textContent = `${info.icon} 升級了！`;
  document.getElementById('levelUpDesc').textContent = `你的信念之樹成長為「${info.name}」！繼續灌溉，財運將更加茂盛！`;
  overlay.classList.add('show');
}

function closeLevelUp() {
  document.getElementById('levelUpOverlay').classList.remove('show');
}

// ==================== RESET ====================
function resetAll() {
  if (confirm('確定要重置所有資料嗎？你的發財樹將從種子重新開始（心情紀錄也會一併清空）...')) {
    state = defaultState();
    saveState();
    updateUI();
    document.getElementById('cooldownText').textContent = '';
    document.getElementById('fortuneMsg').classList.remove('show');
    renderMoodHistory();
    updateMoodHistoryToggleLabel();
  }
}

// ==================== NOTIFICATION ====================
function scheduleNotification() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function sendNotification(msg) {
  if (Notification.permission === 'granted') {
    new Notification('🌳 信念發財樹', { body: msg, icon: '🌳' });
  }
}

// Reminder check every minute
setInterval(() => {
  if (canDrink() && state.todayCups < DAILY_GOAL) {
    const last = state.lastDrinkTime;
    // Notify if it's been more than cooldown + 15 min since last drink
    if (last && (Date.now() - last > (COOLDOWN_MINUTES + 15) * 60000)) {
      sendNotification('該喝水了！你的發財樹正在等你灌溉 💧');
    }
    // Notify if never drank today and it's past 9am
    if (!last && new Date().getHours() >= 9) {
      sendNotification('新的一天開始了！來喝第一杯水，為發財樹注入生命力 🌱');
    }
  }
}, 60000);

// ==================== TABS ====================
const TAB_KEY = 'fortune_tree_last_tab';
const DEFAULT_TAB = 'tree';

function switchTab(name) {
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === name);
  });
  document.querySelectorAll('.tab-content').forEach(c => {
    c.classList.toggle('active', c.dataset.tab === name);
  });
  try { localStorage.setItem(TAB_KEY, name); } catch(e) {}
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
  const saved = (() => {
    try { return localStorage.getItem(TAB_KEY); } catch(e) { return null; }
  })();
  switchTab(saved || DEFAULT_TAB);
}

// ==================== INIT ====================
initTabs();
createStars();
updateUI();
scheduleNotification();
if (getRemainingCooldown() > 0) {
  startCooldownTimer();
}

// Mood journal init
buildMoodPicker();
renderMoodHistory();
updateMoodHistoryToggleLabel();
(function wireMoodInput() {
  const input = document.getElementById('moodInput');
  input.addEventListener('input', updateMoodCount);
  input.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      saveMood();
    }
  });
  updateMoodCount();
})();

// Burn paper init
setBurnCount(getBurnCount());

// Check day rollover periodically
setInterval(() => {
  if (state.todayDate !== getTodayStr()) {
    state = rollOverDay(state);
    saveState();
    updateUI();
  }
}, 60000);

// ==================== MOOD JOURNAL ====================
function buildMoodPicker() {
  const picker = document.getElementById('moodPicker');
  picker.innerHTML = '';
  MOODS.forEach(m => {
    const chip = document.createElement('div');
    chip.className = 'mood-chip';
    chip.dataset.key = m.key;
    chip.innerHTML = `${m.emoji}<span class="mood-label">${m.label}</span>`;
    chip.onclick = () => selectMood(m.key);
    picker.appendChild(chip);
  });
}

function selectMood(key) {
  selectedMood = (selectedMood === key) ? null : key;
  document.querySelectorAll('#moodPicker .mood-chip').forEach(chip => {
    chip.classList.toggle('selected', chip.dataset.key === selectedMood);
  });
}

function saveMood() {
  const input = document.getElementById('moodInput');
  const text = input.value.trim();
  if (!text && !selectedMood) {
    showMoodToast('請選個心情或寫點什麼 💭', '#ffaa00');
    return;
  }
  const now = new Date();
  const entry = {
    id: now.getTime() + '-' + Math.random().toString(36).slice(2, 7),
    ts: now.getTime(),
    date: getTodayStr(),
    time: now.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
    mood: selectedMood,
    text: text,
  };
  state.moods.push(entry);
  saveState();

  // Reward: 2 coins per mood entry (soft reward)
  state.totalCoins += 2;
  saveState();

  // Reset input
  input.value = '';
  selectedMood = null;
  document.querySelectorAll('#moodPicker .mood-chip').forEach(c => c.classList.remove('selected'));
  updateMoodCount();

  // UI feedback
  showMoodToast('已記錄 ✨ +2 金幣', '#6abf4b');
  renderMoodHistory();
  document.getElementById('totalCoins').textContent = state.totalCoins;

  // Small particle reward
  spawnCoinParticles(2);
}

function deleteMood(id) {
  if (!confirm('確定刪除這則心情紀錄？')) return;
  state.moods = state.moods.filter(m => m.id !== id);
  saveState();
  renderMoodHistory();
}

function showMoodToast(msg, color) {
  const toast = document.getElementById('moodToast');
  toast.textContent = msg;
  toast.style.color = color || '#6abf4b';
  toast.classList.add('show');
  clearTimeout(showMoodToast._t);
  showMoodToast._t = setTimeout(() => toast.classList.remove('show'), 2400);
}

function updateMoodCount() {
  const input = document.getElementById('moodInput');
  document.getElementById('moodCount').textContent = `${input.value.length} / 500`;
}

function formatDateLabel(dateStr) {
  const today = getTodayStr();
  const yesterday = getDateStr(new Date(Date.now() - 86400000));
  if (dateStr === today) return '今天';
  if (dateStr === yesterday) return '昨天';
  return dateStr;
}

function renderMoodHistory() {
  const container = document.getElementById('moodHistory');
  if (!state.moods || state.moods.length === 0) {
    container.innerHTML = '<div class="mood-history-empty">還沒有心情紀錄，寫下第一筆吧 ✍️</div>';
    return;
  }
  const sorted = [...state.moods].sort((a, b) => b.ts - a.ts);
  const groups = {};
  sorted.forEach(m => {
    (groups[m.date] = groups[m.date] || []).push(m);
  });

  let html = '';
  Object.keys(groups).forEach(date => {
    html += `<div class="mood-date-group">— ${formatDateLabel(date)} —</div>`;
    groups[date].forEach(m => {
      const moodInfo = MOODS.find(x => x.key === m.mood);
      const moodEmoji = moodInfo ? moodInfo.emoji : '';
      const moodLabel = moodInfo ? moodInfo.label : '';
      const textHtml = escapeHtml(m.text) || '<span style="color:#665540;">(只記錄了心情)</span>';
      html += `
        <div class="mood-entry">
          <button class="entry-del" onclick="deleteMood('${m.id}')" title="刪除">✕</button>
          <div class="entry-head">
            <span class="entry-mood">${moodEmoji} ${moodLabel}</span>
            <span>🕐 ${m.time}</span>
          </div>
          <div class="entry-text">${textHtml}</div>
        </div>
      `;
    });
  });
  container.innerHTML = html;
}

function escapeHtml(s) {
  if (!s) return '';
  return s.replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function toggleMoodHistory() {
  const el = document.getElementById('moodHistory');
  const toggle = document.getElementById('moodHistoryToggle');
  el.classList.toggle('open');
  const count = (state.moods || []).length;
  toggle.textContent = el.classList.contains('open')
    ? '▲ 收起紀錄'
    : `▼ 查看心情紀錄${count ? `（${count}）` : ''}`;
}

function updateMoodHistoryToggleLabel() {
  const el = document.getElementById('moodHistory');
  const toggle = document.getElementById('moodHistoryToggle');
  const count = (state.moods || []).length;
  toggle.textContent = el.classList.contains('open')
    ? '▲ 收起紀錄'
    : `▼ 查看心情紀錄${count ? `（${count}）` : ''}`;
}

// ==================== BURN PAPER (化煞金爐) ====================
// Stores only a count — never the user's words. Content is intentionally ephemeral.
function getBurnCount() {
  return parseInt(localStorage.getItem(BURN_COUNT_KEY) || '0', 10) || 0;
}

function setBurnCount(n) {
  localStorage.setItem(BURN_COUNT_KEY, String(n));
  document.getElementById('burnCount').textContent = n;
}

function showBurnHint(msg, color) {
  const el = document.getElementById('burnHint');
  el.style.color = color || '#a89070';
  el.textContent = msg;
  clearTimeout(showBurnHint._t);
  showBurnHint._t = setTimeout(() => { el.textContent = ''; }, 2600);
}

function burnPaper() {
  if (burnInProgress) return;

  const ta = document.getElementById('burnText');
  const text = ta.value.trim();
  if (!text) {
    showBurnHint('先寫下你想放下的事，再點火', '#ffaa00');
    ta.focus();
    return;
  }

  burnInProgress = true;
  const btn = document.getElementById('burnBtn');
  btn.disabled = true;
  btn.textContent = '焚化中…';

  const stage = document.getElementById('burnStage');
  stage.innerHTML = '';
  stage.classList.add('active');

  // Paper
  const paper = document.createElement('div');
  paper.className = 'burn-paper';
  paper.textContent = text;
  stage.appendChild(paper);

  // Flames (5 staggered)
  const flames = document.createElement('div');
  flames.className = 'burn-flames';
  for (let i = 0; i < 6; i++) {
    const f = document.createElement('div');
    f.className = 'flame';
    f.style.left = `calc(${10 + i * 15}% - 20px)`;
    f.style.animationDelay = (i * 0.08) + 's';
    flames.appendChild(f);
  }
  stage.appendChild(flames);

  // Ignite paper a beat after flames
  setTimeout(() => paper.classList.add('burning'), 500);

  // Ash particles — sprinkle during burn
  const ashTimer = setInterval(() => {
    const ash = document.createElement('div');
    ash.className = 'ash';
    const startLeft = 18 + Math.random() * 64;
    ash.style.left = startLeft + '%';
    ash.style.setProperty('--dx', (Math.random() * 30 - 15) + 'px');
    ash.style.animationDuration = (2 + Math.random() * 1.5) + 's';
    stage.appendChild(ash);
    setTimeout(() => ash.remove(), 4000);
  }, 120);

  // Wrap up after the 4s paper burn completes
  setTimeout(() => {
    clearInterval(ashTimer);
    paper.remove();
    // Let existing flames die out
    flames.style.transition = 'opacity 0.8s';
    flames.style.opacity = '0';
    setTimeout(() => flames.remove(), 900);

    // Aftermath
    const after = document.createElement('div');
    after.className = 'burn-aftermath';
    after.innerHTML = '🕊 煙消雲散<div class="sub">一切歸於寧靜</div>';
    stage.appendChild(after);

    // Increment counter (only the count, not content)
    setBurnCount(getBurnCount() + 1);

    // Clear input ready for next
    ta.value = '';

    // Close stage, re-enable button
    setTimeout(() => {
      stage.classList.remove('active');
      stage.innerHTML = '';
      btn.disabled = false;
      btn.textContent = '🔥 點火焚化';
      burnInProgress = false;
      showBurnHint('已化解。深呼吸，繼續前行 🌿', '#6abf4b');
    }, 2400);
  }, 4500);
}

// ==================== DEMO MODE ====================
let demoMode = false;
let demoAutoInterval = null;
let demoCurrentLevel = 0;

function toggleDemo() {
  const panel = document.getElementById('demoPanel');
  const btn = document.getElementById('demoToggleBtn');
  panel.classList.toggle('open');

  if (panel.classList.contains('open')) {
    btn.textContent = '🎬 收起展示面板';
    demoMode = true;
    buildDemoControls();
    showDemoLevel(0);
  } else {
    btn.textContent = '🎬 模擬展示：預覽全部成長階段';
    demoMode = false;
    stopAutoDemo();
    // Restore real tree
    updateUI();
  }
}

function buildDemoControls() {
  const container = document.getElementById('demoControls');
  container.innerHTML = '';
  TREE_LEVELS.forEach((lvl, i) => {
    const b = document.createElement('button');
    b.textContent = `${lvl.icon} ${lvl.name}`;
    b.dataset.level = i;
    b.onclick = () => {
      stopAutoDemo();
      showDemoLevel(i);
    };
    container.appendChild(b);
  });
}

function showDemoLevel(level) {
  demoCurrentLevel = level;
  const info = TREE_LEVELS[level];

  // Update label
  document.getElementById('demoStageLabel').textContent = `${info.icon}  Lv.${level + 1}  ${info.name}`;
  document.getElementById('demoStageSub').textContent = `需要累積 ${info.minCups} 杯水（約 ${Math.ceil(info.minCups / DAILY_GOAL)} 天）`;

  // Highlight active button
  const btns = document.querySelectorAll('#demoControls button');
  btns.forEach((b, i) => {
    b.classList.toggle('active', i === level);
  });

  // Draw tree at ~70% progress within that level
  drawTree(level, 0.7);

  // Coin particle effect on level change
  spawnCoinParticles(3);

  // Glow
  const svg = document.getElementById('treeSvg');
  svg.classList.remove('glow-pulse');
  void svg.offsetWidth;
  svg.classList.add('glow-pulse');
}

function toggleAutoDemo() {
  if (demoAutoInterval) {
    stopAutoDemo();
  } else {
    startAutoDemo();
  }
}

function startAutoDemo() {
  const btn = document.getElementById('demoAutoBtn');
  btn.textContent = '⏸ 暫停';
  btn.style.background = 'linear-gradient(135deg, #ff8844, #cc5522)';

  showDemoLevel(0);
  demoAutoInterval = setInterval(() => {
    const next = demoCurrentLevel + 1;
    if (next >= TREE_LEVELS.length) {
      // Loop back or stop
      stopAutoDemo();
      showDemoLevel(TREE_LEVELS.length - 1);
      // Show a final fortune
      const el = document.getElementById('fortuneMsg');
      el.textContent = '🧧 恭喜！信念之樹已達傳說等級，財運滿載！';
      el.classList.add('show');
      setTimeout(() => el.classList.remove('show'), 4000);
      return;
    }
    showDemoLevel(next);
  }, 2000);
}

function stopAutoDemo() {
  if (demoAutoInterval) {
    clearInterval(demoAutoInterval);
    demoAutoInterval = null;
  }
  const btn = document.getElementById('demoAutoBtn');
  btn.textContent = '▶ 自動播放';
  btn.style.background = 'linear-gradient(135deg, #88cc55, #66aa33)';
}
