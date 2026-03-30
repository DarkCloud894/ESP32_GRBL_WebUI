#include <Arduino.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <LittleFS.h>
#include <WiFi.h>

const char *ssid = "PISOS-PRO";
const char *password = "pisos410";

AsyncWebServer server(80);
AsyncWebSocket ws("/ws"); // WebSocket endpoint по пути /ws

void onWsEvent(AsyncWebSocket *server, AsyncWebSocketClient *client,
               AwsEventType type, void *arg, uint8_t *data, size_t len) {
  switch (type) {
  case WS_EVT_CONNECT:
    Serial.printf("Client #%u connected\n", client->id());
    client->text("WebSocket ready. Send commands.");
    break;
  case WS_EVT_DISCONNECT:
    Serial.printf("Client #%u disconnected\n", client->id());
    break;
  case WS_EVT_DATA: {
    AwsFrameInfo *info = (AwsFrameInfo *)arg;
    if (info->final && info->index == 0 && info->len == len &&
        info->opcode == WS_TEXT) {
      data[len] = 0;
      String msg = (char *)data;
      Serial.printf("Command from client: %s\n", msg.c_str());

      String response = "";
      // Обработка команд
      if (msg == "up") {
        digitalWrite(5, HIGH);
        response = "UP executed (LED ON)";
      } else if (msg == "down") {
        digitalWrite(5, LOW);
        response = "DOWN executed (LED OFF)";
      } else if (msg == "left") {
        response = "LEFT executed";
      } else if (msg == "right") {
        response = "RIGHT executed";
      } else if (msg == "center") {
        response = "CENTER executed";
      } else if (msg == "help") {
        response = "Available: up, down, left, right, center, help, led on, "
                   "led off, status";
      } else if (msg == "led on") {
        digitalWrite(5, HIGH);
        response = "LED turned ON";
      } else if (msg == "led off") {
        digitalWrite(5, LOW);
        response = "LED turned OFF";
      } else if (msg == "status") {
        bool state = digitalRead(5);
        response = "LED is " + String(state ? "ON" : "OFF");
      } else {
        response = "Unknown command: " + msg;
      }

      // Отправляем ответ клиенту
      client->text(response);
    }
    break;
  }
  default:
    break;
  }
}

void setup() {
  Serial.begin(115200);

  if (!LittleFS.begin(true)) {
    Serial.println("LittleFS mount failed");
    return;
  }
  Serial.println("LittleFS mounted successfully");

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected. IP: " + WiFi.localIP().toString());

  // Обработчик WebSocket
  ws.onEvent(onWsEvent);
  server.addHandler(&ws);

  // Отдаём все файлы из корня SPIFFS
  server.serveStatic("/", LittleFS, "/").setDefaultFile("/index.html"); // Гарантирует, что при запросе '/' сервер отдаст index.html

  // Обработка 404
  server.onNotFound([](AsyncWebServerRequest *request) {
    request->send(404, "text/plain", "Not found");
  });

  server.begin();
}

void loop() {}