let socket;
const terminalOutput = document.getElementById('terminalOutput');
const terminalInput = document.getElementById('terminalInput');
const sendBtn = document.getElementById('sendBtn');

// Функция добавления сообщения в терминал
function addToTerminal(text, isSystem = false) {
  const line = document.createElement('div');
  if (isSystem) {
    line.style.color = '#aaa';
    line.textContent = `[system] ${text}`;
  } else {
    line.textContent = text;
  }
  terminalOutput.appendChild(line);
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

// Инициализация WebSocket
function initWebSocket() {
  const host = window.location.host;
  socket = new WebSocket(`ws://${host}/ws`);

  socket.onopen = function (e) {
    addToTerminal('Соединение установлено', true);
  };

  socket.onmessage = function (event) {
    // Принимаем ответ от ESP32
    addToTerminal(`< ${event.data}`);
  };

  socket.onerror = function (error) {
    addToTerminal(`Ошибка: ${error.message}`, true);
  };

  socket.onclose = function (e) {
    addToTerminal('Соединение закрыто. Переподключение через 3 сек...', true);
    setTimeout(initWebSocket, 3000);
  };
}

// Отправка команды через WebSocket
function sendCommand(cmd) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(cmd);
    addToTerminal(`> ${cmd}`);
  } else {
    addToTerminal('Нет соединения с ESP32', true);
  }
}

// Обработка кнопок крестовины (отправляем те же команды через WebSocket)
function setupButtons() {
  document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', function () {
      let action = '';
      if (this.classList.contains('up')) action = 'up';
      else if (this.classList.contains('down')) action = 'down';
      else if (this.classList.contains('left')) action = 'left';
      else if (this.classList.contains('right')) action = 'right';
      else action = 'center';
      sendCommand(action);
    });
  });
}

// Обработка ввода в терминале
function setupTerminal() {
  sendBtn.addEventListener('click', () => {
    const cmd = terminalInput.value.trim();
    if (cmd) {
      sendCommand(cmd);
      terminalInput.value = '';
    }
  });

  terminalInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendBtn.click();
    }
  });
}

// Запуск при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  initWebSocket();
  setupButtons();
  setupTerminal();
});