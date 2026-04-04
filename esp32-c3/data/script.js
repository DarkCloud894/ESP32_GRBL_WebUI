let socket;
const terminalOutput = document.getElementById('terminalOutput');
const terminalInput = document.getElementById('terminalInput');
const sendBtn = document.getElementById('sendBtn');

// Функция добавления сообщения в терминал
function addToTerminal(text, isSystem = false) {
  const line = document.createElement('div');
  if (isSystem) {
    line.style.color = '#a0b3c9';
    line.style.fontStyle = 'italic';
    line.textContent = `[system] ${text}`;
  } else {
    line.style.color = text.startsWith('>') ? '#f1c40f' : '#b3ffcf';
    line.textContent = text;
  }
  terminalOutput.appendChild(line);
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

// Инициализация WebSocket
function initWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  socket = new WebSocket(wsUrl);

  socket.onopen = () => addToTerminal('WebSocket соединение установлено ✅', true);
  socket.onmessage = (event) => addToTerminal(`< ${event.data}`);
  socket.onerror = (error) => addToTerminal(`Ошибка: ${error.message || 'сбой связи'}`, true);
  socket.onclose = () => {
    addToTerminal('Соединение закрыто. Переподключение через 3 сек...', true);
    setTimeout(initWebSocket, 3000);
  };
}

// Отправка команды через WebSocket
function sendCommand(cmd) {
  if (!cmd || cmd.trim() === "") return;
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(cmd);
    addToTerminal(`> ${cmd}`);
  } else {
    addToTerminal('❌ Нет соединения с ESP32. Переподключение...', true);
    if (!socket || socket.readyState === WebSocket.CLOSED) initWebSocket();
  }
}

// Обработка кнопок джойстика
function setupJoystickButtons() {
  document.querySelectorAll('.cross .btn').forEach(btn => {
    btn.removeEventListener('click', joystickHandler);
    btn.addEventListener('click', joystickHandler);
  });
}

function joystickHandler(e) {
  const btn = e.currentTarget;
  let action = '';
  if (btn.classList.contains('up') && !btn.classList.contains('Zup')) action = 'up';
  else if (btn.classList.contains('down') && !btn.classList.contains('Zdown')) action = 'down';
  else if (btn.classList.contains('left')) action = 'left';
  else if (btn.classList.contains('right')) action = 'right';
  else if (btn.classList.contains('center')) action = 'center';
  else if (btn.classList.contains('Zup')) action = 'z_up';
  else if (btn.classList.contains('Zdown')) action = 'z_down';
  else action = 'click';
  sendCommand(action);
  btn.style.transform = 'scale(0.92)';
  setTimeout(() => { btn.style.transform = ''; }, 100);
}

// Обработка терминала
function setupTerminal() {
  sendBtn.addEventListener('click', () => {
    const cmd = terminalInput.value.trim();
    if (cmd) {
      sendCommand(cmd);
      terminalInput.value = '';
      terminalInput.focus();
    }
  });
  terminalInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendBtn.click();
  });
}

// Сворачивание карточек
function setupCollapse() {
  document.querySelectorAll('.collapse-btn').forEach(btn => {
    btn.removeEventListener('click', collapseHandler);
    btn.addEventListener('click', collapseHandler);
  });
}

function collapseHandler(e) {
  const card = e.currentTarget.closest('.control-card');
  if (!card) return;
  card.classList.toggle('collapsed');
  const btn = e.currentTarget;
  btn.textContent = card.classList.contains('collapsed') ? 'Развернуть' : 'Свернуть';
  btn.style.transform = 'scale(0.97)';
  setTimeout(() => btn.style.transform = '', 120);
  // авто-скролл терминала после разворачивания
  if (card.id === 'terminalCard' && !card.classList.contains('collapsed')) {
    setTimeout(() => terminalOutput.scrollTop = terminalOutput.scrollHeight, 50);
  }
}

// Наблюдатель за скроллом терминала при разворачивании
const observer = new MutationObserver((mutations) => {
  mutations.forEach(mut => {
    if (mut.attributeName === 'class' && mut.target.id === 'terminalCard' && !mut.target.classList.contains('collapsed')) {
      setTimeout(() => terminalOutput.scrollTop = terminalOutput.scrollHeight, 50);
    }
  });
});

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
  initWebSocket();
  setupJoystickButtons();
  setupTerminal();
  setupCollapse();
  observer.observe(document.getElementById('terminalCard'), { attributes: true, attributeFilter: ['class'] });
  addToTerminal('ESP32 Remote Terminal | WebSocket ready', true);
  addToTerminal('Используйте кнопки джойстика или вводите команды вручную', true);
});