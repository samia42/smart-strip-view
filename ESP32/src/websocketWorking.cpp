#include <WiFi.h>
#include <WebSocketsServer.h>

const char *ssid = "BoxnetA";
const char *password = "BoxnetArduino";

WebSocketsServer webSocket = WebSocketsServer(81);

const int SENSOR_PIN_1 = 34;
const int RELAY_PIN_1 = 14;

const float SENSITIVITY = 0.100;
const float VREF = 3.3;
const int ADC_RES = 4095;
const float RESISTOR_MULTIPLIER = 1.545454;

float measuredOffset = 2.5;

float getACCurrent() {
  float sumSquares = 0;
  long sampleCount = 0;
  unsigned long startTime = millis();

  while (millis() - startTime < 20) {
    int adcValue = analogRead(SENSOR_PIN_1);
    float voltagePin = (adcValue * VREF) / ADC_RES;
    float voltageOriginal = voltagePin * RESISTOR_MULTIPLIER;
    
    float currentInst = (voltageOriginal - measuredOffset) / SENSITIVITY;
    
    sumSquares += (currentInst * currentInst);
    sampleCount++;
  }

  float rms = sqrt(sumSquares / sampleCount);
  
  //if (rms < 0.10) rms = 0.0; 
  return rms;
}

void webSocketEvent(uint8_t num, WStype_t type, uint8_t *payload, size_t length)
{
  if (type == WStype_TEXT)
  {
    String msg = String((char *)payload);
    if (msg == "RELAY_ON")
    {
      digitalWrite(14, HIGH);
      Serial.println("RELAY ON");
    }
    else if (msg == "RELAY_OFF")
    {
      digitalWrite(14, LOW);
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
    float voltageOriginal = voltagePin * RESISTOR_MULTIPLIER;
    float current1 = (voltageOriginal - measuredOffset) / SENSITIVITY;

    int relayState = digitalRead(14);

    Serial.print("ADC: ");
    Serial.print(adcValue);

    Serial.print(" | V_Pin: ");
    Serial.print(voltagePin, 3);
    Serial.print("V");

    Serial.print(" | V_Sensor: ");
    Serial.print(voltageOriginal, 3);
    Serial.print("V");

    Serial.print(" | Current: ");
    Serial.print(current1, 2);
    Serial.println(" A");

    // JSON
    String json = "{\"c1\": " + String(current1, 1) +
                  ", \"c2\": " + String("0", 1) +
                  ", \"relay\": " + String(relayState) + "}";
    webSocket.broadcastTXT(json);
  }
}
