#include <WiFi.h>
#include <WebSocketsServer.h>
#include <ESPmDNS.h>
#include <WiFiManager.h>
#include <LittleFS.h>

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

void printFile(const char* path)
{
  File file = LittleFS.open(path, FILE_READ);
  if (!file)
  {
    Serial.println("Impossible d'ouvrir " + String(path));
    return;
  }

  Serial.println("---- Contenu de " + String(path) + " ----");
  while (file.available())
  {
    Serial.write(file.read());
  }
  Serial.println("\n--------------------------");
  file.close();
}

String readLine(File &file) //to read line by line the csv
{
  String line = "";
  while (file.available())
  {
    char c = file.read();
    if (c == '\n') break;
    line += c;
  }
  return line;
}

void appendSlidingCSV(const char* path, String value, int maxLines)
{
  std::vector<String> lines;

  // read the file
  if (LittleFS.exists(path))
  {
    File file = LittleFS.open(path, FILE_READ);
    if (file)
    {
      while (file.available())
      {
        String line = readLine(file);
        if (line.length() > 0)
          lines.push_back(line);
      }
      file.close();
    }
  }

  // if aboce maximum amount, remove oldest
  if (lines.size() >= maxLines)
  {
    lines.erase(lines.begin());
  }

  // Add new value
  lines.push_back(value);

  // Re-write the file
  File file = LittleFS.open(path, FILE_WRITE);
  if (!file)
  {
    Serial.println("Erreur écriture " + String(path));
    return;
  }

  for (String &l : lines)
  {
    file.println(l);
  }
  file.close();
}

void debugCSVSliding(const char* path, int maxLines) // remove this function when it will work
{
  if (!LittleFS.exists(path))
  {
    Serial.println(String("[DEBUG] ") + path + " n'existe pas");
    return;
  }

  File file = LittleFS.open(path, FILE_READ);
  if (!file)
  {
    Serial.println(String("[DEBUG] Impossible d'ouvrir ") + path);
    return;
  }

  int lineCount = 0;
  String firstLine = "";
  String lastLine = "";

  while (file.available())
  {
    String line = file.readStringUntil('\n');
    line.trim();
    if (line.length() == 0) continue;

    if (lineCount == 0)
      firstLine = line;

    lastLine = line;
    lineCount++;
  }

  file.close();

  Serial.println("------ DEBUG CSV ------");
  Serial.println("Fichier : " + String(path));
  Serial.println("Lignes  : " + String(lineCount) + " / " + String(maxLines));
  Serial.println("Première: " + firstLine);
  Serial.println("Dernière: " + lastLine);

  if (lineCount > maxLines)
    Serial.println("⚠️ ERREUR : dépassement de limite !");
  else if (lineCount == maxLines)
    Serial.println("✅ Taille max atteinte (glissement OK)");
  else
    Serial.println("⏳ Remplissage en cours");

  Serial.println("-----------------------\n");
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
  //       LittleFS
  // ---------------------
  if (!LittleFS.begin(true))
  {
    Serial.println("Erreur LittleFS");
  }
  else
  {
    Serial.println("LittleFS monté avec succès");
  }
  LittleFS.begin(false); //to avoid emptying the files

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
      appendSlidingCSV("/minute.csv", String(sumPowerMin, 2), 60);

      printFile("/minute.csv"); // debug

      debugCSVSliding("/minute.csv", 60); //debug

      sumPowerHour += sumPowerMin; // add for hour
      countMin++;

      sumPowerMin = 0;  // reset minute
      countSec = 0;

      // ======================
      //    TOTAL PER HOUR
      // ======================
      if (countMin >= 60)
      {
        appendSlidingCSV("/hour.csv", String(sumPowerHour, 2), 24);

        sumPowerDay += sumPowerHour; // add for day
        countHour++;

        sumPowerHour = 0;
        countMin = 0;

        // ======================
        //    TOTAL PER DAY
        // ======================
        if (countHour >= 24)
        {
          appendSlidingCSV("/day.csv", String(sumPowerDay, 2), 30);

          sumPowerMonth += sumPowerDay; // add for month
          countDay++;

          sumPowerDay = 0;
          countHour = 0;

          // ======================
          //    TOTAL PER MONTH
          // ======================
          if (countDay >= 30)
          {
            appendSlidingCSV("/month.csv", String(sumPowerMonth, 2), 12);

            sumPowerYear += sumPowerMonth; // add for year
            countMonth++;

            sumPowerMonth = 0;
            countDay = 0;

            // ======================
            //    TOTAL PER YEAR
            // ======================
            if (countMonth >= 12)
            {
              appendSlidingCSV("/year.csv", String(sumPowerYear, 2), 10); // ex : 10 years
              sumPowerYear = 0;
              countMonth = 0;
            }
          }
        }
      }
    }
  }
}