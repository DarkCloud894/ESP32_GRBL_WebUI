#include <Arduino.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <SPIFFS.h>
#include <WiFi.h>

const char *ssid = "PISOS-PRO";
const char *password = "pisos410";

AsyncWebServer server(80);

void setup() {
  Serial.begin(115200);

  if (!SPIFFS.begin(true)) {
    Serial.println("SPIFFS mount failed");
    return;
  }
  Serial.println("SPIFFS mounted successfully");

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected. IP: " + WiFi.localIP().toString());

  // Отдаём все файлы из корня SPIFFS
  server.serveStatic("/", SPIFFS, "/").setDefaultFile("index.html"); // Гарантирует, что при запросе '/' сервер отдаст index.html

  // Обработка 404
  server.onNotFound([](AsyncWebServerRequest *request) {
    request->send(404, "text/plain", "Not found");
  });

  server.begin();
}

void loop() {}