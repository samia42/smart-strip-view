#include <WiFi.h>
#include <WebSocketsServer.h>
#include <ESPmDNS.h>
#include <WiFiManager.h>
#include <LittleFS.h>
#include <time.h>
#include <ArduinoJson.h>

WebSocketsServer webSocket = WebSocketsServer(81);
WiFiManager wifiManager;

const int savePeriod = 15; // in minutes

const int SENSOR_PIN_1 = 34;
const int RELAY_PIN_1 = 14;

// Current sensor parameters
const float SENSITIVITY = 0.100;
const float VREF = 3.3;
const int ADC_RES = 4095;
const float RESISTOR_MULTIPLIER = 1.545454;
float measuredOffset = 2.5;

// NTP server for time synchronization
const char *ntpServer = "pool.ntp.org";

// Buffers for historical data
const int SIZE_24H = int(24 * 60 / savePeriod);
float buffer24h[SIZE_24H];
int head24h = 0;

const int SIZE_30D = 30;
float buffer30d[SIZE_30D];
int head30d = 0;

const int size_12M = 12;
float buffer12m[size_12M];
int head12m = 0;

// RAM buffer for minute history
float ramHistoryMinutes[60];
int headRamMinutes = 0;

// Sums and counters for averaging
float sumForMinute = 0;
int countForMinute = 0;
float sumFor15Min = 0;
int countFor15Min = 0;
float sumForDay = 0;
int countForDay = 0;
float sumForMonth = 0;
int countForMonth = 0;

// Last time markers for period transitions
int lastMinute = -1;
int lastDay = -1;
int lastMonth = -1;

// Last time data was written to flash
time_t lastWriteTime = 0;

unsigned long lastWifiCheck = 0;
const unsigned long WIFI_TIMEOUT = 30000;

// Save last write time to flash
void saveLastWriteTime(time_t timestamp)
{
  lastWriteTime = timestamp;
  File file = LittleFS.open("/last_time.bin", FILE_WRITE);
  if (file)
  {
    file.write((uint8_t *)&lastWriteTime, sizeof(lastWriteTime));
    file.close();
  }
}

// Load last write time from flash
void loadLastWriteTime()
{
  if (!LittleFS.exists("/last_time.bin"))
  {
    Serial.println("Time file missing. Creating default.");
    lastWriteTime = 0;
    saveLastWriteTime(lastWriteTime);
    return;
  }

  File file = LittleFS.open("/last_time.bin", "r");
  if (file)
  {
    file.read((uint8_t *)&lastWriteTime, sizeof(lastWriteTime));
    file.close();
  }
}

// Save a circular buffer to flash
template <typename T>
void saveBuffer(const char *path, T *buffer, int size, int head)
{
  File file = LittleFS.open(path, FILE_WRITE);
  if (!file)
    return;
  file.write((uint8_t *)&head, sizeof(head));
  file.write((uint8_t *)buffer, size * sizeof(T));
  file.close();
}

// Load a circular buffer from flash
template <typename T>
void loadBuffer(const char *path, T *buffer, int size, int &head)
{
  if (!LittleFS.exists(path))
  {
    Serial.print("File missing: ");
    Serial.print(path);
    Serial.println(" -> Creating it now...");

    File file = LittleFS.open(path, "w");
    if (file)
    {
      int zeroHead = 0;
      file.write((uint8_t *)&zeroHead, sizeof(zeroHead));
      file.write((uint8_t *)buffer, size * sizeof(T));
      file.close();
      Serial.println("File created successfully.");
    }
    else
    {
      Serial.println("Failed to create file!");
    }

    head = 0;
    return;
  }

  File file = LittleFS.open(path, "r");
  if (file)
  {
    if (file.size() == (sizeof(head) + size * sizeof(T)))
    {
      file.read((uint8_t *)&head, sizeof(head));
      file.read((uint8_t *)buffer, size * sizeof(T));
    }
    file.close();
  }
}

// Add a value to the RAM minute buffer
void addToRamMinutes(float val)
{
  ramHistoryMinutes[headRamMinutes] = val;
  headRamMinutes = (headRamMinutes + 1) % 60;
}

// Add a value to the 24h buffer and save to flash
void addTo24hBuffer(float val)
{
  buffer24h[head24h] = val;
  head24h = (head24h + 1) % SIZE_24H;
  saveBuffer("/data_24h.bin", buffer24h, SIZE_24H, head24h);
}

// Add a value to the 30d buffer and save to flash
void addTo30dBuffer(float val)
{
  buffer30d[head30d] = val;
  head30d = (head30d + 1) % SIZE_30D;
  saveBuffer("/data_30d.bin", buffer30d, SIZE_30D, head30d);
}

// Add a value to the 12m buffer and save to flash
void addToMonthsBuffer(float val)
{
  buffer12m[head12m] = val;
  head12m = (head12m + 1) % size_12M;
  saveBuffer("/data_12m.bin", buffer12m, size_12M, head12m);
}

// Fill gaps in data after a reboot or power cut
void fillGapsAfterBoot()
{
  time_t now;
  time(&now);
  if (lastWriteTime == 0 || now < lastWriteTime)
  {
    return;
  }
  long secondsOffline = now - lastWriteTime;
  int missedPoints15m = secondsOffline / (savePeriod * 60);
  if (missedPoints15m > SIZE_24H)
    missedPoints15m = SIZE_24H;
  if (missedPoints15m > 0)
  {
    Serial.print("Power cut detected! Adding ");
    Serial.print(missedPoints15m);
    Serial.println(" empty points (0.0) to the 24h graph.");
    for (int i = 0; i < missedPoints15m; i++)
    {
      addTo24hBuffer(0.0);
    }
  }
  int missedPointsDay = secondsOffline / 86400;
  if (missedPointsDay > SIZE_30D)
    missedPointsDay = SIZE_30D;
  if (missedPointsDay > 0)
  {
    for (int i = 0; i < missedPointsDay; i++)
    {
      addTo30dBuffer(0.0);
    }
  }
  saveLastWriteTime(now);
}

// Generate JSON string with all historical data for web app
String getFullWebJSON()
{
  JsonDocument doc;

  JsonArray arr60m = doc["graph_60m"].to<JsonArray>();
  for (int i = 0; i < 60; i++)
  {
    arr60m.add(ramHistoryMinutes[(headRamMinutes + i) % 60]);
  }
  JsonArray arr24h = doc["graph_24h"].to<JsonArray>();
  for (int i = 0; i < SIZE_24H; i++)
  {
    arr24h.add(buffer24h[(head24h + i) % SIZE_24H]);
  }
  JsonArray arr30d = doc["graph_30d"].to<JsonArray>();
  for (int i = 0; i < SIZE_30D; i++)
  {
    arr30d.add(buffer30d[(head30d + i) % SIZE_30D]);
  }
  JsonArray arrMonths = doc["graph_months"].to<JsonArray>();
  for (int i = 0; i < size_12M; i++)
  {
    arrMonths.add(buffer12m[(head12m + i) % size_12M]);
  }
  String output;
  serializeJson(doc, output);
  return output;
}

// Measure AC current
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
  return rms;
}

// Handle incoming WebSocket events from the web app
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
    else if (msg == "GET_FULL_DATA")
    {
      String fullJson = getFullWebJSON();
      webSocket.sendTXT(num, fullJson);
      Serial.println("Sent full data JSON to webapp.");
    }
  }
}

void setup()
{
  Serial.begin(115200);

  delay(5000);
  Serial.println("\n\nSmart Power Strip Starting...");

  if (!LittleFS.begin(true)) {
    Serial.println("LittleFS Mount Failed");
  } else {
    Serial.println("LittleFS OK");
  }

  // Initialize buffers and load saved data
  memset(buffer24h, 0, sizeof(buffer24h));
  memset(buffer30d, 0, sizeof(buffer30d));
  memset(buffer12m, 0, sizeof(buffer12m));
  memset(ramHistoryMinutes, 0, sizeof(ramHistoryMinutes));
  loadBuffer("/data_24h.bin", buffer24h, SIZE_24H, head24h);
  loadBuffer("/data_30d.bin", buffer30d, SIZE_30D, head30d);
  loadBuffer("/data_12m.bin", buffer12m, size_12M, head12m);

  pinMode(RELAY_PIN_1, OUTPUT);
  digitalWrite(RELAY_PIN_1, LOW);
  pinMode(SENSOR_PIN_1, INPUT);

  // WiFi setup
  const char *customHead = R"raw()raw";
  wifiManager.setCustomHeadElement(customHead);
  wifiManager.setTitle("Smart Power Strip Wifi Setup");
  const char *menu[] = {"wifi"};
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

  // Start mDNS
  if (!MDNS.begin("SmartPowerStrip"))
  {
    Serial.println("MDNS failed to start");
    return;
  }
  delay(1000);

  // Time and NTP setup
  loadLastWriteTime();
  configTime(0, 0, ntpServer);
  struct tm timeinfo;
  Serial.print("Waiting for NTP sync...");
  while (!getLocalTime(&timeinfo))
  {
    Serial.print(".");
    delay(500);
  }
  Serial.println(" OK");
  lastMinute = timeinfo.tm_min;
  fillGapsAfterBoot();

  // Calibrate sensor offset
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

  // Start WebSocket server
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
}

void loop()
{

  unsigned long now = millis();

  if (WiFi.status() != WL_CONNECTED) {
    if (now - lastWifiCheck >= WIFI_TIMEOUT) {
      Serial.println("Lost WiFi. Attempting to reconnect...");
      WiFi.disconnect();
      WiFi.reconnect();
      lastWifiCheck = now;
    }
  }

  webSocket.loop();

  static unsigned long lastOneSec = 0;

  if (now - lastOneSec >= 1000)
  {
    lastOneSec = now;

    // Measure current and broadcast live data
    float currentInst = getACCurrent(SENSOR_PIN_1);
    int relayState = digitalRead(RELAY_PIN_1);
    Serial.print("Current: ");
    Serial.print(currentInst, 2);
    Serial.println(" A");
    String liveJson = "{\"live\": " + String(currentInst, 2) + ", \"relay\": " + String(relayState) + "}";
    webSocket.broadcastTXT(liveJson);

    // Add data for minute, 15min, day, month
    sumForMinute += currentInst;
    countForMinute++;
    struct tm timeinfo;
    if (getLocalTime(&timeinfo))
    {
      // New minute
      if (timeinfo.tm_min != lastMinute)
      {
        float avgMinute = (countForMinute > 0) ? sumForMinute / countForMinute : 0;
        addToRamMinutes(avgMinute);
        Serial.print("(RAM) Minute saved. Average: ");
        Serial.print(avgMinute, 3);
        Serial.println(" A");
        sumFor15Min += avgMinute;
        countFor15Min++;
        sumForMinute = 0;
        countForMinute = 0;

        // New 15min period
        if (timeinfo.tm_min % savePeriod == 0)
        {
          float avg15 = (countFor15Min > 0) ? sumFor15Min / countFor15Min : 0;
          addTo24hBuffer(avg15);
          time_t now;
          time(&now);
          saveLastWriteTime(now);
          sumForDay += avg15;
          countForDay++;
          Serial.println("\nFLASH SAVE");
          Serial.println(getFullWebJSON());
          Serial.println("");
          String fullJson = getFullWebJSON();
          Serial.println("Sent full data JSON to webapp.");
          webSocket.broadcastTXT(fullJson);
          sumFor15Min = 0;
          countFor15Min = 0;
        }
        lastMinute = timeinfo.tm_min;
      }

      // New day
      if (timeinfo.tm_mday != lastDay && lastDay != -1)
      {
        float avgDay = (countForDay > 0) ? sumForDay / countForDay : 0;
        addTo30dBuffer(avgDay);
        sumForMonth += avgDay;
        countForMonth++;
        Serial.print("(flash) Day saved. Average: ");
        Serial.println(avgDay);
        sumForDay = 0;
        countForDay = 0;

        // New month
        if (timeinfo.tm_mon != lastMonth && lastMonth != -1)
        {
          float avgMonth = (countForMonth > 0) ? sumForMonth / countForMonth : 0;
          addToMonthsBuffer(avgMonth);
          Serial.print("(flash) Month saved. Average: ");
          Serial.println(avgMonth);
          sumForMonth = 0;
          countForMonth = 0;
        }
        lastMonth = timeinfo.tm_mon;
      }
      lastDay = timeinfo.tm_mday;
    }
  }
}