#include <WiFi.h>
#include <WebSocketsServer.h>
#include <ESPmDNS.h>
#include <WiFiManager.h>
#include <SPIFFS.h>

float sumPowerMin = 0;   // total power minute
float sumPowerHour = 0;  // total power hour
float sumPowerDay = 0;   // total power day
float sumPowerMonth = 0; // total power month
float sumPowerYear = 0;  // total power year

int countSec = 0;   // seconds for minute
int countMin = 0;   // minutes for hour
int countHour = 0;  // hours for day
int countDay = 0;   // days for month
int countMonth = 0; // months for year

WebSocketsServer webSocket = WebSocketsServer(81);
WiFiManager wifiManager;

const int SENSOR_PIN_1 = 34;
const int RELAY_PIN_1 = 14;

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

void appendCSV(const char* path, String value) {
  File file = SPIFFS.open(path, FILE_APPEND);
  if(!file){
    Serial.print("Error when opening file: "); Serial.println(path);
    return;
  }
  file.println(value);
  file.close();
}

void printFile(const char* path)
{
  File file = SPIFFS.open(path, FILE_READ);
  if (!file)
  {
    Serial.println("Cannot Open " + String(path));
    return;
  }

  Serial.println("---- " + String(path) + "' Content ----");
  while (file.available())
  {
    Serial.write(file.read());
  }
  Serial.println("\n--------------------------");
  file.close();
}

void setup()
{
  // ---------------------
  //      Serial
  // ---------------------
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n=== Démarrage SmartPowerStrip ===");

  // ---------------------
  //        Pins
  // ---------------------
  pinMode(RELAY_PIN_1, OUTPUT);
  digitalWrite(RELAY_PIN_1, LOW);

  pinMode(SENSOR_PIN_1, INPUT);

  // ---------------------
  //        SPIFFS
  // ---------------------
  if (!SPIFFS.begin(true))
  {
    Serial.println("Erreur SPIFFS");
  }

  // ---------------------
  //      WiFiManager
  // ---------------------
  std::vector<const char *> menu = {"wifi", "restart"};
  wifiManager.setMenu(menu);

  bool res = wifiManager.autoConnect("SmartPowerStrip_Config");

  if(!res)
  {
    Serial.println("Échec connexion WiFi");
  }
  else
  {
    Serial.println("Connecté au WiFi !");
    Serial.println(WiFi.localIP());
  }

  // ---------------------
  //        MDNS
  // ---------------------
  if (!MDNS.begin("SmartPowerStrip"))
  {
    Serial.println("MDNS failed to start");
  }
  else
  {
    Serial.println("MDNS démarré : SmartPowerStrip.local");
  }

  delay(1000);

  // ---------------------
  //        Captor
  // ---------------------
  float sum = 0.0;
  for (int i = 0; i < 100; i++)
  {
    float vPin = (analogRead(SENSOR_PIN_1) * VREF) / ADC_RES;
    sum += vPin * RESISTOR_MULTIPLIER;
    delay(10);
  }

  measuredOffset = sum / 100.0;
  Serial.print("Offset initial mesuré : ");
  Serial.println(measuredOffset, 3);

  // ---------------------
  //      WebSocket
  // ---------------------
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);

  Serial.println("\nSetup terminé !");
}



void loop()
{
  webSocket.loop();

  static unsigned long lastSecond = 0;
  unsigned long now = millis();

  if (now - lastSecond >= 1000)   // chaque seconde
  {
    lastSecond = now;

    int adcValue = analogRead(SENSOR_PIN_1);
    float voltagePin = (adcValue * VREF) / ADC_RES;
    float current1 = getACCurrent(SENSOR_PIN_1);
    float power1 = current1 * 230;
    int relayState = digitalRead(RELAY_PIN_1);

    // ======================
    //    Serial print
    // ======================
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

    // ======================
    //      WebSocket
    // ======================
    String json = "{\"c1\": " + String(current1, 1) +
                  ", \"c2\": 0" +
                  ", \"relay\": " + String(relayState) + "}";
    webSocket.broadcastTXT(json);

    // ======================
    //   TOTAL PER MINUTE
    // ======================
    sumPowerMin += power1;
    countSec++;

    if (countSec >= 60)
    {
      appendCSV("/minute.csv", String(sumPowerMin, 2));
      printFile("/minute.csv"); // debug

      sumPowerHour += sumPowerMin; // add for hour
      countMin++;

      sumPowerMin = 0;  // reset minute
      countSec = 0;

      // ======================
      //    TOTAL PER HOUR
      // ======================
      if (countMin >= 60)
      {
        appendCSV("/hour.csv", String(sumPowerHour, 2));
        sumPowerDay += sumPowerHour; // add for day
        countHour++;

        sumPowerHour = 0;
        countMin = 0;

        // ======================
        //    TOTAL PER DAY
        // ======================
        if (countHour >= 24)
        {
          appendCSV("/day.csv", String(sumPowerDay, 2));
          sumPowerMonth += sumPowerDay; // add for month
          countDay++;

          sumPowerDay = 0;
          countHour = 0;

          // ======================
          //    TOTAL PER MONTH
          // ======================
          if (countDay >= 30)
          {
            appendCSV("/month.csv", String(sumPowerMonth, 2));
            sumPowerYear += sumPowerMonth; // add for year
            countMonth++;

            sumPowerMonth = 0;
            countDay = 0;

            // ======================
            //    TOTAL PER YEAR
            // ======================
            if (countMonth >= 12)
            {
              appendCSV("/year.csv", String(sumPowerYear, 2));
              sumPowerYear = 0;
              countMonth = 0;
            }
          }
        }
      }
    }
  }
}