#include <WiFi.h>
#include <WebSocketsServer.h>

const char* ssid = "BoxnetA";
const char* password = "BoxnetArduino";

WebSocketsServer webSocket = WebSocketsServer(81);

void webSocketEvent(uint8_t num, WStype_t type, uint8_t *payload, size_t length)
{
  if (type == WStype_TEXT)
  {
    String msg = String((char *)payload);
    if (msg == "LED_ON")
    {
      digitalWrite(2, HIGH);
      Serial.println("LED ON command received");
    }
    else if (msg == "LED_OFF")
    {
      digitalWrite(2, LOW);
      Serial.println("LED OFF command received");
    }
  }
}

void setup()
{
  Serial.begin(115200);

  pinMode(2, OUTPUT);
  digitalWrite(2, HIGH);

  WiFi.begin(ssid, password);
  Serial.print("Connexion...");
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nConnecté !");
  Serial.print("Adresse IP: ");
  Serial.println(WiFi.localIP());

  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
}

void loop()
{
  webSocket.loop();

  static unsigned long lastSend = 0;
  unsigned long now = millis();
  if (now - lastSend >= 1000)
  {
    lastSend = now;
    // Generated Data
    float current1 = random(100, 200) / 10.0; // 10.0 → 20.0 A
    float current2 = random(50, 100) * 100.0; // 5.0 → 10.0 A
    // JSON
    String json = "{\"c1\": " + String(current1, 1) + ", \"c2\": " + String(current2, 1) + "}";
    webSocket.broadcastTXT(json);
  }
}
