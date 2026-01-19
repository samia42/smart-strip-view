#include <WiFi.h>
#include <WebSocketsServer.h>
#include <ESPmDNS.h>
#include <WiFiManager.h>

WebSocketsServer webSocket = WebSocketsServer(81);
WiFiManager wifiManager;

const int SENSOR_PIN_1 = 4; // 14
const int RELAY_PIN_1 = 5;  // 34

const float SENSITIVITY = 0.100;
const float VREF = 3.3;
const int ADC_RES = 4095;
const float RESISTOR_MULTIPLIER = 1.545454;

float measuredOffset = 2.5;

float getACCurrent(int sensorPin)
{
  float sumSquares = 0;
  long sampleCount = 0;
  unsigned long startTime = millis();

  while (millis() - startTime < 20)
  {
    int adcValue = analogRead(sensorPin);
    float voltagePin = (adcValue * VREF) / ADC_RES;
    float voltageOriginal = voltagePin * RESISTOR_MULTIPLIER;

    float currentInst = (voltageOriginal - measuredOffset) / SENSITIVITY;

    sumSquares += (currentInst * currentInst);
    sampleCount++;
  }

  float rms = sqrt(sumSquares / sampleCount);

  // if (rms < 0.10) rms = 0.0;
  return rms;
}

void webSocketEvent(uint8_t num, WStype_t type, uint8_t *payload, size_t length)
{
  if (type == WStype_TEXT)
  {
    String msg = String((char *)payload);
    if (msg == "RELAY_ON")
    {
      digitalWrite(RELAY_PIN_1, HIGH);
      Serial.println("RELAY ON");
    }
    else if (msg == "RELAY_OFF")
    {
      digitalWrite(RELAY_PIN_1, LOW);
      Serial.println("RELAY OFF");
    }
  }
}

void setup()
{
  Serial.begin(115200);

  pinMode(RELAY_PIN_1, OUTPUT);
  digitalWrite(RELAY_PIN_1, LOW);

  pinMode(SENSOR_PIN_1, INPUT);

  wifiManager.resetSettings();

  const char* customHead = R"raw()raw";

  wifiManager.setCustomHeadElement(customHead);
  wifiManager.setTitle("Smart Power Strip Wifi Setup");

  const char* menu[] = {"wifi"};
  wifiManager.setMenu(menu, 1);

  bool res = wifiManager.autoConnect("SmartPowerStrip_Config");

  if (!res)
  {
    Serial.println("Failed to connect");
  }
  else
  {
    Serial.println("Connected to WiFi!");
    Serial.println(WiFi.localIP());
  }

  Serial.println("\nConnected!");

  if (!MDNS.begin("SmartPowerStrip"))
  {
    Serial.println("MDNS failed to start");
    return;
  }

  delay(1000);

  float sum = 0.0;
  for (int i = 0; i < 100; i++)
  {
    float vPin = (analogRead(SENSOR_PIN_1) * VREF) / ADC_RES;
    sum += vPin * RESISTOR_MULTIPLIER;
    delay(10);
  }

  measuredOffset = sum / 100.0;
  Serial.print("Initial offset: ");
  Serial.println(measuredOffset, 3);

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

    int adcValue = analogRead(SENSOR_PIN_1);
    float voltagePin = (adcValue * VREF) / ADC_RES;
    float current1 = getACCurrent(SENSOR_PIN_1);
    float power1 = current1 * 230;

    int relayState = digitalRead(RELAY_PIN_1);

    Serial.print("ADC: ");
    Serial.print(adcValue);

    Serial.print(" | V_Pin: ");
    Serial.print(voltagePin, 3);
    Serial.print("V");

    Serial.print(" | Current: ");
    Serial.print(current1, 2);
    Serial.print(" A");

    Serial.print(" | Power: ");
    Serial.print(power1, 2);
    Serial.println(" W");

    // JSON
    String json = "{\"c1\": " + String(current1, 1) +
                  ", \"c2\": " + String("0", 1) +
                  ", \"relay\": " + String(relayState) + "}";
    webSocket.broadcastTXT(json);
  }
}
