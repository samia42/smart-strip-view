#include <WiFi.h>
#include <WebSocketsServer.h>

const char* ssid = "BoxnetA";
const char* password = "BoxnetArduino";

WebSocketsServer webSocket = WebSocketsServer(81);

void setup() {
  Serial.begin(115200);

  WiFi.begin(ssid, password);
  Serial.print("Connexion...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nConnecté !");
  Serial.print("Adresse IP: ");
  Serial.println(WiFi.localIP());

  webSocket.begin();
}

void loop() {
  webSocket.loop();

  // Generated Data
  float current1 = random(100, 200) / 10.0; // 10.0 → 20.0 A
  float current2 = random(50, 100) * 100.0;  // 5.0 → 10.0 A

  // JSON
  String json = "{\"c1\": " + String(current1, 1) + ", \"c2\": " + String(current2, 1) + "}";
  webSocket.broadcastTXT(json);
  delay(1000);
}

