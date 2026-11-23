// ---- Sidebar navigation (client-side section switching, no routing) ----
const sidebar = document.getElementById('sidebar');
const sidebarBackdrop = document.getElementById('sidebarBackdrop');

function closeSidebar() {
  sidebar.classList.remove('open');
  if (sidebarBackdrop) sidebarBackdrop.classList.remove('open');
}

document.querySelectorAll('.nav-link[data-page]').forEach(function (link) {
  link.addEventListener('click', function () {
    const page = link.dataset.page;
    document.querySelectorAll('.nav-link[data-page]').forEach(l => l.classList.toggle('active', l === link));
    document.querySelectorAll('.page-body').forEach(function (section) {
      section.hidden = section.id !== 'page-' + page;
    });
    closeSidebar();
  });
});

const menuToggle = document.getElementById('menuToggle');
if (menuToggle) {
  menuToggle.addEventListener('click', function () {
    sidebar.classList.toggle('open');
    if (sidebarBackdrop) sidebarBackdrop.classList.toggle('open');
  });
}
if (sidebarBackdrop) sidebarBackdrop.addEventListener('click', closeSidebar);

// ---- Logout ----
document.getElementById('logoutBtn').addEventListener('click', function () {
  fetch('/api/logout', { method: 'POST' }).finally(function () {
    window.location = '/login.html';
  });
});

// ---- Schedule toggle (schedule-on / schedule-off) ----
document.getElementById('scheduleSwitch').addEventListener('click', function () {
  const track = this;
  const sub = track.nextElementSibling.querySelector('.sub');
  const turningOn = !track.classList.contains('on');

  track.classList.toggle('on');
  sub.textContent = turningOn ? 'Activado (8am - medianoche)' : 'Desactivado';

  function revert() {
    track.classList.toggle('on');
    sub.textContent = turningOn ? 'Desactivado' : 'Activado (8am - medianoche)';
  }

  fetch('/api/control/' + (turningOn ? 'schedule-on' : 'schedule-off'), { method: 'POST' })
    .then(function (resp) { if (!resp.ok) revert(); })
    .catch(revert);
});

// ---- Servidor / Respaldos action buttons ----
document.querySelectorAll('button.action[data-action]').forEach(function (btn) {
  btn.addEventListener('click', function () {
    const action = btn.dataset.action;
    btn.disabled = true;
    fetch('/api/control/' + action, { method: 'POST' })
      .catch(function () {})
      .finally(function () { updateStatus(); });
  });
});

// ---- Mundo quick commands (day/night/weather) ----
document.querySelectorAll('button.action[data-game-action]').forEach(function (btn) {
  btn.addEventListener('click', function () {
    const action = btn.dataset.gameAction;
    btn.disabled = true;
    fetch('/api/game/command/' + action, { method: 'POST' })
      .catch(function () {})
      .finally(function () { btn.disabled = false; });
  });
});

// ---- Quick command selects (one per Console/Overview instance) ----
document.querySelectorAll('[data-quick-command-select]').forEach(function (select) {
  const submit = select.parentElement.querySelector('[data-quick-command-submit]');
  if (!submit) return;
  select.addEventListener('change', function () {
    submit.disabled = !select.value;
  });
  submit.addEventListener('click', function () {
    const action = select.value;
    if (!action) return;
    submit.disabled = true;
    select.disabled = true;
    fetch('/api/game/command/' + action, { method: 'POST' })
      .catch(function () {})
      .finally(function () {
        select.disabled = false;
        select.value = '';
        submit.disabled = true;
      });
  });
});

// ---- Status polling ----
function updateStatus() {
  fetch('/api/status').then(function (resp) {
    return resp.ok ? resp.json() : null;
  }).then(function (data) {
    if (!data) return;
    const isActive = data.status === 'active';
    document.querySelectorAll('[data-status-pill]').forEach(function (pill) {
      pill.classList.toggle('offline', !isActive);
      pill.querySelector('[data-status-text]').textContent = isActive ? 'Online' : 'Offline';
    });
    const uptimeEl = document.getElementById('statusUptime');
    if (uptimeEl) uptimeEl.innerHTML = 'Servicio: <b>' + (data.status || 'desconocido') + '</b>';
    updateServerButtons(isActive);
  }).catch(function () {});
}

function updateServerButtons(isActive) {
  document.querySelectorAll('button.action[data-action="start"]').forEach(b => b.disabled = isActive);
  document.querySelectorAll('button.action[data-action="stop"]').forEach(b => b.disabled = !isActive);
  document.querySelectorAll('button.action[data-action="restart"]').forEach(b => b.disabled = !isActive);
}
updateStatus();
setInterval(updateStatus, 5000);

// ---- Log filters (applies to lines present now and appended later, per log box) ----
function applyLogFilter(logBox) {
  const active = logBox.parentElement.querySelector('.log-filter-btn.active');
  const filter = active ? active.dataset.filter : 'all';
  logBox.querySelectorAll(':scope > div').forEach(function (line) {
    line.hidden = filter !== 'all' && line.dataset.level !== filter;
  });
  return filter;
}

document.querySelectorAll('[data-log-clear]').forEach(function (btn) {
  btn.addEventListener('click', function () {
    const logBox = btn.closest('.log-head').parentElement.querySelector('.log-box');
    logBox.innerHTML = '<div class="log-empty">Sin actividad reciente</div>';
  });
});

document.querySelectorAll('[data-log-copy]').forEach(function (btn) {
  btn.addEventListener('click', function () {
    const logBox = btn.closest('.log-head').parentElement.querySelector('.log-box');
    const text = Array.from(logBox.querySelectorAll(':scope > div:not(.log-empty)')).map(l => l.textContent).join('\n');
    if (navigator.clipboard && text) navigator.clipboard.writeText(text).catch(function () {});
  });
});

document.querySelectorAll('.log-filter-btn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    const group = btn.closest('.log-head').parentElement;
    group.querySelectorAll('.log-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    applyLogFilter(group.querySelector('.log-box'));
  });
});

// ---- Live log: initial fetch + WebSocket, mirrored into every log box on the page ----
const logBoxes = Array.from(document.querySelectorAll('.log-box'));

function parseLogLine(raw) {
  const match = raw.match(/^\[(\d{2}:\d{2}:\d{2})\]\s*\[[^\]]*\/(INFO|WARN|ERROR)\]:\s*(.*)$/);
  if (match) {
    return { ts: match[1], level: match[2].toLowerCase(), message: match[3] };
  }
  const now = new Date();
  return { ts: now.toTimeString().slice(0, 8), level: 'info', message: raw };
}

function appendLogLine(raw) {
  if (raw === '') return;
  const parsed = parseLogLine(raw);
  const level = parsed.level === 'warn' || parsed.level === 'error' ? 'warn' : 'info';

  logBoxes.forEach(function (logBox) {
    const placeholder = logBox.querySelector('.log-empty');
    if (placeholder) placeholder.remove();

    const div = document.createElement('div');
    div.dataset.level = level;

    const ts = document.createElement('span');
    ts.className = 'ts';
    ts.textContent = parsed.ts;

    const lvl = document.createElement('span');
    lvl.className = level === 'warn' ? 'lvl-warn' : 'lvl-info';
    lvl.textContent = level === 'warn' ? '[WARN]' : '[INFO]';

    div.appendChild(ts);
    div.appendChild(lvl);
    div.appendChild(document.createTextNode(' ' + parsed.message));

    const activeBtn = logBox.parentElement.querySelector('.log-filter-btn.active');
    const activeFilter = activeBtn ? activeBtn.dataset.filter : 'all';
    div.hidden = activeFilter !== 'all' && div.dataset.level !== activeFilter;

    logBox.appendChild(div);
    logBox.scrollTop = logBox.scrollHeight;
  });
}

fetch('/api/logs/recent').then(function (resp) {
  return resp.ok ? resp.json() : null;
}).then(function (data) {
  if (!data) return;
  if (!data.lines.length) {
    logBoxes.forEach(function (logBox) {
      logBox.innerHTML = '<div class="log-empty">Sin actividad reciente</div>';
    });
    return;
  }
  data.lines.forEach(appendLogLine);
  logBoxes.forEach(applyLogFilter);
}).catch(function () {});

const wsProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
const logSocket = new WebSocket(`${wsProtocol}//${location.host}/ws/logs`);
logSocket.addEventListener('message', function (event) {
  appendLogLine(event.data);
});

// ---- Players list (mirrored into every players list on the page) ----
const AVATAR_THEMES = [
  { skin: '#e8b690', hair: '#5c3a21', eye: '#1a1a1a' },
  { skin: '#e8b690', hair: '#c0531f', eye: '#1a1a1a' },
  { skin: '#d9641f', hair: '#d9641f', eye: '#1a1a1a', ear: '#d9641f' },
  { skin: '#9aa5b1', hair: '#5b6672', eye: '#55e0ff', visor: '#263140' },
  { skin: '#e8b690', hair: '#2b2b2b', eye: '#1a1a1a' },
  { skin: '#c9d97a', hair: '#4a6b2a', eye: '#1a1a1a' },
];

function buildAvatarSVG(theme) {
  let rects = '';
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      let color;
      if (theme.ear && y === 0 && (x === 0 || x === 7)) color = theme.ear;
      else if (y <= 1) color = theme.hair;
      else if (theme.visor && y === 4) color = theme.visor;
      else color = theme.skin;
      rects += '<rect x="' + x + '" y="' + y + '" width="1" height="1" fill="' + color + '"/>';
    }
  }
  rects += '<rect x="2" y="4" width="1" height="1" fill="' + theme.eye + '"/>';
  rects += '<rect x="5" y="4" width="1" height="1" fill="' + theme.eye + '"/>';
  return '<svg viewBox="0 0 8 8" shape-rendering="crispEdges">' + rects + '</svg>';
}

function renderPlayers(data) {
  const players = data.players || [];
  const online = data.online || 0;
  const max = data.max || 0;

  document.querySelectorAll('[data-players-online]').forEach(el => el.textContent = online);
  document.querySelectorAll('[data-players-max]').forEach(el => el.textContent = max);
  document.querySelectorAll('[data-players-count]').forEach(el => el.textContent = online + ' / ' + max);
  document.querySelectorAll('[data-players-bar]').forEach(el => {
    el.style.width = (max > 0 ? Math.min(100, Math.round((online / max) * 100)) : 0) + '%';
  });

  const emptySlots = Math.max(0, max - online);
  document.querySelectorAll('[data-players-empty]').forEach(el => {
    el.textContent = emptySlots > 0 ? `${emptySlots} plazas libres` : '';
  });

  document.querySelectorAll('[data-players-list]').forEach(function (list) {
    const limit = list.dataset.playersList === 'compact' ? 4 : players.length;
    list.innerHTML = '';

    if (players.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'empty-state';
      empty.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>' +
        '<span>No hay jugadores conectados</span>';
      list.appendChild(empty);
      return;
    }

    players.slice(0, limit).forEach(function (name, i) {
      const li = document.createElement('li');
      const avatar = document.createElement('span');
      avatar.className = 'avatar';
      avatar.innerHTML = buildAvatarSVG(AVATAR_THEMES[i % AVATAR_THEMES.length]);

      const info = document.createElement('span');
      info.className = 'player-info';
      const nameSpan = document.createElement('span');
      nameSpan.className = 'player-name';
      nameSpan.textContent = name;
      const sub = document.createElement('span');
      sub.className = 'player-sub';
      sub.innerHTML = '<span class="dot"></span> Online';
      info.appendChild(nameSpan);
      info.appendChild(sub);

      li.appendChild(avatar);
      li.appendChild(info);

      if (list.dataset.playersList !== 'compact') {
        const actions = document.createElement('span');
        actions.className = 'player-actions';
        actions.innerHTML =
          '<button class="icon-btn" disabled title="Próximamente"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>' +
          '<button class="icon-btn danger" disabled title="Próximamente"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01"/></svg></button>';
        li.appendChild(actions);
      }
      list.appendChild(li);
    });
  });

  renderTpOptions(players);
}

// ---- TP menu ----
const tpFrom = document.getElementById('tpFrom');
const tpTo = document.getElementById('tpTo');
const tpSubmit = document.getElementById('tpSubmit');
const tpHint = document.getElementById('tpHint');

function renderTpOptions(players) {
  if (!tpFrom || !tpTo) return;
  [tpFrom, tpTo].forEach(function (select) {
    const previous = select.value;
    const placeholder = select.options[0];
    select.innerHTML = '';
    select.appendChild(placeholder);
    players.forEach(function (name) {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      select.appendChild(opt);
    });
    if (players.includes(previous)) select.value = previous;
  });

  const enoughPlayers = players.length >= 2;
  tpFrom.disabled = !enoughPlayers;
  tpTo.disabled = !enoughPlayers;
  tpHint.textContent = enoughPlayers
    ? ''
    : 'Conéctate con al menos 2 jugadores en línea para usar el TP.';
  updateTpSubmitState();
}

function updateTpSubmitState() {
  if (!tpFrom || !tpTo) return;
  const from = tpFrom.value;
  const to = tpTo.value;
  tpSubmit.disabled = !from || !to || from === to;
  tpHint.textContent = from && to && from === to ? 'Elige dos jugadores distintos.' : tpHint.textContent;
}

if (tpFrom && tpTo) {
  tpFrom.addEventListener('change', updateTpSubmitState);
  tpTo.addEventListener('change', updateTpSubmitState);

  tpSubmit.addEventListener('click', function () {
    const from_player = tpFrom.value;
    const to_player = tpTo.value;
    if (!from_player || !to_player || from_player === to_player) return;
    tpSubmit.disabled = true;
    fetch('/api/game/tp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from_player: from_player, to_player: to_player }),
    })
      .catch(function () {})
      .finally(function () { updateTpSubmitState(); });
  });
}

function updatePlayers() {
  fetch('/api/players').then(function (resp) {
    return resp.ok ? resp.json() : null;
  }).then(function (data) {
    if (data) renderPlayers(data);
  }).catch(function () {});
}
updatePlayers();
setInterval(updatePlayers, 10000);

// ---- Charts ----
function makeChartOpts() {
  return {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: '#7d8694', font: { size: 10 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 5 }, grid: { display: false }, border: { display: false } },
      y: { ticks: { display: false }, grid: { color: '#262d3d', borderDash: [3, 4] }, border: { display: false } }
    }
  };
}

function fillGradient(ctx, color) {
  const g = ctx.createLinearGradient(0, 0, 0, 150);
  g.addColorStop(0, color + '55');
  g.addColorStop(1, color + '00');
  return g;
}

const cpuCtx = document.getElementById('cpuChart').getContext('2d');
const cpuChart = new Chart(cpuCtx, {
  type: 'line',
  data: { labels: [], datasets: [{ label: 'CPU %', data: [], borderColor: '#eab53d', backgroundColor: fillGradient(cpuCtx, '#eab53d'), fill: true, tension: 0.35, pointRadius: 0, borderWidth: 2 }] },
  options: makeChartOpts()
});

const ramCtx = document.getElementById('ramChart').getContext('2d');
const ramChart = new Chart(ramCtx, {
  type: 'line',
  data: { labels: [], datasets: [
    { label: 'Java (GB)', data: [], borderColor: '#eab53d', backgroundColor: fillGradient(ramCtx, '#eab53d'), fill: true, tension: 0.35, pointRadius: 0, borderWidth: 2 }
  ] },
  options: makeChartOpts()
});

function formatTimeLabel(iso) {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toTimeString().slice(0, 5);
}

function updateMetrics() {
  fetch('/api/metrics').then(function (resp) {
    return resp.ok ? resp.json() : null;
  }).then(function (data) {
    if (!data) return;
    const labels = (data.labels || []).map(formatTimeLabel);

    cpuChart.data.labels = labels;
    cpuChart.data.datasets[0].data = data.cpu || [];
    cpuChart.update();

    ramChart.data.labels = labels;
    ramChart.data.datasets[0].data = data.ram_java_gb || [];
    ramChart.update();

    const cpu = data.cpu || [];
    const ramJava = data.ram_java_gb || [];
    const ramVm = data.ram_vm_gb || [];
    if (cpu.length) {
      document.querySelectorAll('[data-cpu-value]').forEach(el => {
        el.innerHTML = Math.round(cpu[cpu.length - 1]) + '<span class="unit">%</span>';
      });
    }
    if (ramJava.length) {
      document.querySelectorAll('[data-ram-java-value]').forEach(el => {
        el.innerHTML = ramJava[ramJava.length - 1].toFixed(1) + '<span class="unit">GB</span>';
      });
    }
    if (ramVm.length) {
      document.querySelectorAll('[data-ram-vm-value]').forEach(el => {
        el.textContent = ramVm[ramVm.length - 1].toFixed(1) + ' GB';
      });
    }
  }).catch(function () {});
}
updateMetrics();
setInterval(updateMetrics, 10000);
