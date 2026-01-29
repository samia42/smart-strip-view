#include <WiFi.h>
#include <WebSocketsServer.h>
#include <ESPmDNS.h>
#include <WiFiManager.h>
#include <LittleFS.h>
#include <time.h>
#include <ArduinoJson.h>

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define OLED_SDA 21
#define OLED_SCL 22
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

WebSocketsServer webSocket = WebSocketsServer(81);
WiFiManager wifiManager;

const int savePeriod = 15; // in minutes

const int CURRENT1_5A_PIN = 36;
const int CURRENT1_20A_PIN = 39;

const int CURRENT2_5A_PIN = 34;
const int CURRENT2_20A_PIN = 35;

const int CURRENT3_5A_PIN = 32;
const int CURRENT3_20A_PIN = 33;

const int RELAY_PIN_1 = 27;
const int RELAY_PIN_2 = 26;
const int RELAY_PIN_3 = 25;

// Current sensor parameters
const float SENSITIVITY_20A = 0.100;
const float SENSITIVITY_5A = 0.185;
const float VREF = 3.3;
const int ADC_RES = 4095;
const float RESISTOR_MULTIPLIER = 1.545454;

const float AC_VOLTAGE = 230.0;

float offset1_20A = 2.5;
float offset1_5A = 2.5;
float offset2_20A = 2.5;
float offset2_5A = 2.5;
float offset3_20A = 2.5;
float offset3_5A = 2.5;

// NTP server for time synchronization
const char *ntpServer = "pool.ntp.org";

// Buffers for historical data - [plug_idx][time_idx]
const int SIZE_24H = int(24 * 60 / savePeriod);
float buffer24h[3][SIZE_24H];
int head24h = 0;

const int SIZE_31D = 31;
float buffer31d[3][SIZE_31D];
int head31d = 0;

const int SIZE_MONTHS = 60; // 5 years of monthly data
float buffermonths[3][SIZE_MONTHS];
int headmonths = 0;

// RAM buffer for minute history
float ramHistoryMinutes[3][60];
int headRamMinutes = 0;

// Sums and counters for averaging
float sumForMinute[3] = {0, 0, 0};
int countForMinute = 0;

float sumFor15Min[3] = {0, 0, 0};
int countFor15Min = 0;

float sumForDay[3] = {0, 0, 0};
int countForDay = 0;

float sumForMonth[3] = {0, 0, 0};
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
void saveBuffer(const char *path, T *buffer, int totalElements, int head)
{
  File file = LittleFS.open(path, FILE_WRITE);
  if (!file)
    return;
  file.write((uint8_t *)&head, sizeof(head));
  file.write((uint8_t *)buffer, totalElements * sizeof(T));
  file.close();
}

// Load a circular buffer from flash
template <typename T>
void loadBuffer(const char *path, T *buffer, int totalElements, int &head)
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
      // Write zeros
      for (int i = 0; i < totalElements; i++)
      {
        T zero = 0;
        file.write((uint8_t *)&zero, sizeof(T));
      }
      file.close();
    }
    head = 0;
    return;
  }

  File file = LittleFS.open(path, "r");
  if (file)
  {
    size_t expectedSize = sizeof(head) + (totalElements * sizeof(T));
    if (file.size() == expectedSize)
    {
      file.read((uint8_t *)&head, sizeof(head));
      file.read((uint8_t *)buffer, totalElements * sizeof(T));
    }
    else
    {
      Serial.println("File size mismatch (structure changed?), resetting.");
      file.close();
      LittleFS.remove(path);
      loadBuffer(path, buffer, totalElements, head); // Recursively create new
      return;
    }
    file.close();
  }
}

// Add values for all 3 plugs to the RAM minute buffer
void addToRamMinutes(float p1, float p2, float p3)
{
  ramHistoryMinutes[0][headRamMinutes] = p1;
  ramHistoryMinutes[1][headRamMinutes] = p2;
  ramHistoryMinutes[2][headRamMinutes] = p3;
  headRamMinutes = (headRamMinutes + 1) % 60;
}

// Add values and save 24h buffer
void addTo24hBuffer(float p1, float p2, float p3, bool save = true)
{
  buffer24h[0][head24h] = p1;
  buffer24h[1][head24h] = p2;
  buffer24h[2][head24h] = p3;
  head24h = (head24h + 1) % SIZE_24H;

  if (save)
  {
    saveBuffer("/data_24h.bin", (float *)buffer24h, 3 * SIZE_24H, head24h);
  }
}

// Add values and save 31d buffer
void addTo31dBuffer(float p1, float p2, float p3, bool save = true)
{
  buffer31d[0][head31d] = p1;
  buffer31d[1][head31d] = p2;
  buffer31d[2][head31d] = p3;
  head31d = (head31d + 1) % SIZE_31D;

  if (save)
  {
    saveBuffer("/data_31d.bin", (float *)buffer31d, 3 * SIZE_31D, head31d);
  }
}

// Add values and save 12m buffer
void addToMonthsBuffer(float p1, float p2, float p3, bool save = true)
{
  buffermonths[0][headmonths] = p1;
  buffermonths[1][headmonths] = p2;
  buffermonths[2][headmonths] = p3;
  headmonths = (headmonths + 1) % SIZE_MONTHS; // Remember to use your new size_12M (60) constant

  if (save)
  {
    saveBuffer("/data_months.bin", (float *)buffermonths, 3 * SIZE_MONTHS, headmonths);
  }
}

// Fill gaps in data after a reboot or power cut
void fillGapsAfterBoot()
{
  time_t now;
  time(&now);

  if (lastWriteTime == 0 || now < lastWriteTime)
  {
    saveLastWriteTime(now);
    return;
  }

  long secondsOffline = now - lastWriteTime;

  // If offline for > 5 years : reset to avoid a massive loop
  if (secondsOffline > (157788000))
  { // 5 years in seconds
    Serial.println("Offline too long. Resetting sync time only.");
    saveLastWriteTime(now);
    return;
  }

  struct tm lastTm;
  localtime_r(&lastWriteTime, &lastTm);
  int trackerDay = lastTm.tm_mday;
  int trackerMonth = lastTm.tm_mon;

  time_t cursor = lastWriteTime + (savePeriod * 60);

  Serial.println("Synchronizing gaps...");

  while (cursor <= now)
  {
    addTo24hBuffer(0.0, 0.0, 0.0, false);

    countForDay++;
    struct tm cursorTm;
    localtime_r(&cursor, &cursorTm);

    // Did we cross midnight?
    if (cursorTm.tm_mday != trackerDay)
    {
      float avgDay[3];
      for (int i = 0; i < 3; i++)
        avgDay[i] = (countForDay > 0) ? sumForDay[i] / countForDay : 0;

      // Save to 31-Day Buffer
      addTo31dBuffer(avgDay[0], avgDay[1], avgDay[2], false);

      Serial.printf("Gap Fill: Day Saved (Avg P1: %.1f)\n", avgDay[0]);

      for (int i = 0; i < 3; i++)
      {
        sumForMonth[i] += avgDay[i];
      }
      countForMonth++;

      for (int i = 0; i < 3; i++)
        sumForDay[i] = 0;
      countForDay = 0;

      if (cursorTm.tm_mon != trackerMonth)
      {
        float avgMonth[3];
        for (int i = 0; i < 3; i++)
          avgMonth[i] = (countForMonth > 0) ? sumForMonth[i] / countForMonth : 0;

        addToMonthsBuffer(avgMonth[0], avgMonth[1], avgMonth[2], false);
        Serial.println("Gap Fill: Month Saved.");

        for (int i = 0; i < 3; i++)
          sumForMonth[i] = 0;
        countForMonth = 0;
        trackerMonth = cursorTm.tm_mon;
      }
      trackerDay = cursorTm.tm_mday;
    }

    cursor += (savePeriod * 60);
  }

  saveBuffer("/data_24h.bin", (float *)buffer24h, 3 * SIZE_24H, head24h);
  saveBuffer("/data_31d.bin", (float *)buffer31d, 3 * SIZE_31D, head31d);
  saveBuffer("/data_months.bin", (float *)buffermonths, 3 * SIZE_MONTHS, headmonths);
  saveLastWriteTime(now);

  struct tm nowTm;
  localtime_r(&now, &nowTm);
  lastDay = nowTm.tm_mday;
  lastMonth = nowTm.tm_mon;
  lastMinute = nowTm.tm_min;
}

// Helper to add data to JSON document based on circular buffer
void addPlugHistory(JsonDocument &doc, const char *rootKey, const char *plugKey, float *buffer, int size, int head)
{
  if (!doc.containsKey(rootKey))
    doc[rootKey].to<JsonObject>();
  JsonArray arr = doc[rootKey][plugKey].to<JsonArray>();
  for (int i = 0; i < size; i++)
  {
    arr.add(buffer[(head + i) % size]);
  }
}

// Graph Types: 0=All, 1=1h, 2=24h, 3=31d, 4=months
// Plug IDs: 0=All, 1=Plug1, 2=Plug2, 3=Plug3
String getHistoryJSON(int plugId, int graphId)
{
  JsonDocument doc;

  // 1 Minute History (RAM) - "history_1h"
  if (graphId == 0 || graphId == 1)
  {
    if (plugId == 0 || plugId == 1)
      addPlugHistory(doc, "history_1h", "plug_1", ramHistoryMinutes[0], 60, headRamMinutes);
    if (plugId == 0 || plugId == 2)
      addPlugHistory(doc, "history_1h", "plug_2", ramHistoryMinutes[1], 60, headRamMinutes);
    if (plugId == 0 || plugId == 3)
      addPlugHistory(doc, "history_1h", "plug_3", ramHistoryMinutes[2], 60, headRamMinutes);
  }

  // 15 Min History (Flash) - "history_24h"
  if (graphId == 0 || graphId == 2)
  {
    if (plugId == 0 || plugId == 1)
      addPlugHistory(doc, "history_24h", "plug_1", buffer24h[0], SIZE_24H, head24h);
    if (plugId == 0 || plugId == 2)
      addPlugHistory(doc, "history_24h", "plug_2", buffer24h[1], SIZE_24H, head24h);
    if (plugId == 0 || plugId == 3)
      addPlugHistory(doc, "history_24h", "plug_3", buffer24h[2], SIZE_24H, head24h);
  }

  // Daily History (Flash) - "history_31d"
  if (graphId == 0 || graphId == 3)
  {
    if (plugId == 0 || plugId == 1)
      addPlugHistory(doc, "history_31d", "plug_1", buffer31d[0], SIZE_31D, head31d);
    if (plugId == 0 || plugId == 2)
      addPlugHistory(doc, "history_31d", "plug_2", buffer31d[1], SIZE_31D, head31d);
    if (plugId == 0 || plugId == 3)
      addPlugHistory(doc, "history_31d", "plug_3", buffer31d[2], SIZE_31D, head31d);
  }

  // Monthly History (Flash) - "history_months"
  if (graphId == 0 || graphId == 4)
  {
    if (plugId == 0 || plugId == 1)
      addPlugHistory(doc, "history_months", "plug_1", buffermonths[0], SIZE_MONTHS, headmonths);
    if (plugId == 0 || plugId == 2)
      addPlugHistory(doc, "history_months", "plug_2", buffermonths[1], SIZE_MONTHS, headmonths);
    if (plugId == 0 || plugId == 3)
      addPlugHistory(doc, "history_months", "plug_3", buffermonths[2], SIZE_MONTHS, headmonths);
  }

  String output;
  serializeJson(doc, output);
  return output;
}

// Measure AC current
float getACCurrent(int sensorPin, float sensitivity, float offset)
{
  float sumSquares = 0;
  long sampleCount = 0;
  unsigned long startTime = millis();
  while (millis() - startTime < 20)
  {
    int adcValue = analogRead(sensorPin);
    float voltagePin = (adcValue * VREF) / ADC_RES;
    float voltageOriginal = voltagePin * RESISTOR_MULTIPLIER;
    float currentInst = (voltageOriginal - offset) / sensitivity;
    sumSquares += (currentInst * currentInst);
    sampleCount++;
  }
  float rms = sqrt(sumSquares / sampleCount);
  return rms;
}

float getMergedCurrent(float val20A, float val5A)
{
  if (val5A < 4.5)
    return val5A;
  return val20A;
}

// Helper function to get debug info for a sensor
void printSensorDebug(int sensorPin, const char *label)
{
  int raw = analogRead(sensorPin);
  float voltagePin = (raw * VREF) / ADC_RES;
  float voltageOriginal = voltagePin * RESISTOR_MULTIPLIER;
  Serial.print(label);
  Serial.print(" RAW: ");
  Serial.print(raw);
  Serial.print(" | Vpin: ");
  Serial.print(voltagePin, 3);
}

// Handle incoming WebSocket events from the web app
void webSocketEvent(uint8_t num, WStype_t type, uint8_t *payload, size_t length)
{
  if (type == WStype_TEXT)
  {
    String msg = String((char *)payload);
    Serial.println("WS Recv: " + msg);

    if (msg == "RELAY1_ON")
    {
      digitalWrite(RELAY_PIN_1, HIGH);
    }
    else if (msg == "RELAY1_OFF")
    {
      digitalWrite(RELAY_PIN_1, LOW);
    }
    else if (msg == "RELAY2_ON")
    {
      digitalWrite(RELAY_PIN_2, HIGH);
    }
    else if (msg == "RELAY2_OFF")
    {
      digitalWrite(RELAY_PIN_2, LOW);
    }
    else if (msg == "RELAY3_ON")
    {
      digitalWrite(RELAY_PIN_3, HIGH);
    }
    else if (msg == "RELAY3_OFF")
    {
      digitalWrite(RELAY_PIN_3, LOW);
    }

    // History Requests: GET_HISTORY [PLUG=x] [TYPE=x]
    else if (msg.startsWith("GET_HISTORY"))
    {
      int plugId = 0; // 0=All
      if (msg.indexOf("PLUG=1") >= 0)
        plugId = 1;
      if (msg.indexOf("PLUG=2") >= 0)
        plugId = 2;
      if (msg.indexOf("PLUG=3") >= 0)
        plugId = 3;

      int graphId = 0; // 0=All
      if (msg.indexOf("TYPE=1h") >= 0)
        graphId = 1;
      if (msg.indexOf("TYPE=24h") >= 0)
        graphId = 2;
      if (msg.indexOf("TYPE=31d") >= 0)
        graphId = 3;
      if (msg.indexOf("TYPE=months") >= 0)
        graphId = 4;

      String json = getHistoryJSON(plugId, graphId);
      webSocket.sendTXT(num, json);
      Serial.printf("Sent history JSON (Size: %d)\n", json.length());
    }
  }
}

void reconstructAccumulators()
{
  if (lastWriteTime == 0)
    return;

  struct tm lastTm;
  localtime_r(&lastWriteTime, &lastTm);
  int targetMonth = lastTm.tm_mon;
  int targetDay = lastTm.tm_mday;

  for (int k = 0; k < 3; k++)
    sumForMonth[k] = 0;
  countForMonth = 0;

  Serial.println("Reconstructing Month...");

  for (int i = 0; i < SIZE_31D; i++)
  {
    int idx = (head31d - 1 - i + SIZE_31D) % SIZE_31D;

    time_t tDate = lastWriteTime - ((i + 1) * 86400);
    struct tm tTm;
    localtime_r(&tDate, &tTm);

    if (tTm.tm_mon == targetMonth)
    {
      sumForMonth[0] += buffer31d[0][idx];
      sumForMonth[1] += buffer31d[1][idx];
      sumForMonth[2] += buffer31d[2][idx];
      countForMonth++;
    }
    else
    {
      break;
    }
  }
  Serial.printf(" recovered %d days.\n", countForMonth);

  for (int k = 0; k < 3; k++)
    sumForDay[k] = 0;
  countForDay = 0;

  // Scan backwards through 24h buffer
  for (int i = 0; i < SIZE_24H; i++)
  {
    int idx = (head24h - 1 - i + SIZE_24H) % SIZE_24H;

    time_t tTime = lastWriteTime - ((i + 1) * savePeriod * 60);
    struct tm tTm;
    localtime_r(&tTime, &tTm);

    if (tTm.tm_mday == targetDay && tTm.tm_mon == targetMonth)
    {
      sumForDay[0] += buffer24h[0][idx];
      sumForDay[1] += buffer24h[1][idx];
      sumForDay[2] += buffer24h[2][idx];
      countForDay++;
    }
    else
    {
      break;
    }
  }
}

void updateDisplayState(int r1, float c1, int r2, float c2, int r3, float c3)
{
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);

  int col1_x = 21;
  int col2_x = 64;
  int col3_x = 107;

  if (r3 == HIGH)
    display.fillCircle(col1_x, 22, 18, SSD1306_WHITE);
  else
    display.drawCircle(col1_x, 22, 18, SSD1306_WHITE);

  if (r2 == HIGH)
    display.fillCircle(col2_x, 22, 18, SSD1306_WHITE);
  else
    display.drawCircle(col2_x, 22, 18, SSD1306_WHITE);

  if (r1 == HIGH)
    display.fillCircle(col3_x, 22, 18, SSD1306_WHITE);
  else
    display.drawCircle(col3_x, 22, 18, SSD1306_WHITE);

  display.setTextSize(1);

  display.setCursor(col1_x - 14, 55);
  display.print(c3, 2);
  display.print("W");

  display.setCursor(col2_x - 14, 55);
  display.print(c2, 2);
  display.print("W");

  display.setCursor(col3_x - 14, 55);
  display.print(c1, 2);
  display.print("W");

  display.display();
}

void setup()
{
  Serial.begin(115200);

  delay(5000);

  Serial.println("\n\nSmart Power Strip Starting...");

  Wire.begin(OLED_SDA, OLED_SCL);
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C))
  {
    Serial.println(F("SSD1306 allocation failed"));
  }
  display.setRotation(2);
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.display();

  if (!LittleFS.begin(true))
  {
    Serial.println("LittleFS Mount Failed");
  }
  else
  {
    Serial.println("LittleFS OK");
  }

  // Initialize buffers and load saved data
  memset(buffer24h, 0, sizeof(buffer24h));
  memset(buffer31d, 0, sizeof(buffer31d));
  memset(buffermonths, 0, sizeof(buffermonths));
  memset(ramHistoryMinutes, 0, sizeof(ramHistoryMinutes));

  // NOTE: loadBuffer now takes 3*SIZE because we cast 2D array to pointer
  loadBuffer("/data_24h.bin", (float *)buffer24h, 3 * SIZE_24H, head24h);
  loadBuffer("/data_31d.bin", (float *)buffer31d, 3 * SIZE_31D, head31d);
  loadBuffer("/data_months.bin", (float *)buffermonths, 3 * SIZE_MONTHS, headmonths);

  pinMode(RELAY_PIN_1, OUTPUT);
  pinMode(RELAY_PIN_2, OUTPUT);
  pinMode(RELAY_PIN_3, OUTPUT);
  digitalWrite(RELAY_PIN_1, LOW);
  digitalWrite(RELAY_PIN_2, LOW);
  digitalWrite(RELAY_PIN_3, LOW);

  pinMode(CURRENT1_20A_PIN, INPUT);
  pinMode(CURRENT1_5A_PIN, INPUT);
  pinMode(CURRENT2_20A_PIN, INPUT);
  pinMode(CURRENT2_5A_PIN, INPUT);
  pinMode(CURRENT3_20A_PIN, INPUT);
  pinMode(CURRENT3_5A_PIN, INPUT);

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

  if (lastWriteTime > 0)
  {
    struct tm lastTm;
    localtime_r(&lastWriteTime, &lastTm);
    lastDay = lastTm.tm_mday;
    lastMonth = lastTm.tm_mon;
    reconstructAccumulators();
  }
  else
  {
    lastDay = timeinfo.tm_mday;
    lastMonth = timeinfo.tm_mon;
  }

  fillGapsAfterBoot();

  getLocalTime(&timeinfo);
  lastMinute = timeinfo.tm_min;

  float sum1_20 = 0, sum1_5 = 0;
  float sum2_20 = 0, sum2_5 = 0;
  float sum3_20 = 0, sum3_5 = 0;

  for (int i = 0; i < 100; i++)
  {
    sum1_20 += analogRead(CURRENT1_20A_PIN);
    sum1_5 += analogRead(CURRENT1_5A_PIN);
    sum2_20 += analogRead(CURRENT2_20A_PIN);
    sum2_5 += analogRead(CURRENT2_5A_PIN);
    sum3_20 += analogRead(CURRENT3_20A_PIN);
    sum3_5 += analogRead(CURRENT3_5A_PIN);
    delay(5);
  }

  auto calc = [](float sum)
  { return ((sum / 100.0) * VREF / ADC_RES) * RESISTOR_MULTIPLIER; };

  offset1_20A = calc(sum1_20);
  offset1_5A = calc(sum1_5);
  offset2_20A = calc(sum2_20);
  offset2_5A = calc(sum2_5);
  offset3_20A = calc(sum3_20);
  offset3_5A = calc(sum3_5);

  // Start WebSocket server
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
}

void loop()
{

  unsigned long now = millis();

  if (WiFi.status() != WL_CONNECTED)
  {
    if (now - lastWifiCheck >= WIFI_TIMEOUT)
    {
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

    float c1_20 = getACCurrent(CURRENT1_20A_PIN, SENSITIVITY_20A, offset1_20A);
    float c1_5 = getACCurrent(CURRENT1_5A_PIN, SENSITIVITY_5A, offset1_5A);
    float current1 = getMergedCurrent(c1_20, c1_5);

    float c2_20 = getACCurrent(CURRENT2_20A_PIN, SENSITIVITY_20A, offset2_20A);
    float c2_5 = getACCurrent(CURRENT2_5A_PIN, SENSITIVITY_5A, offset2_5A);
    float current2 = getMergedCurrent(c2_20, c2_5);

    float c3_20 = getACCurrent(CURRENT3_20A_PIN, SENSITIVITY_20A, offset3_20A);
    float c3_5 = getACCurrent(CURRENT3_5A_PIN, SENSITIVITY_5A, offset3_5A);
    float current3 = getMergedCurrent(c3_20, c3_5);

    float power1 = current1 * AC_VOLTAGE;
    float power2 = current2 * AC_VOLTAGE;
    float power3 = current3 * AC_VOLTAGE;

    int relay1State = digitalRead(RELAY_PIN_1);
    int relay2State = digitalRead(RELAY_PIN_2);
    int relay3State = digitalRead(RELAY_PIN_3);

    updateDisplayState(relay1State, power1, relay2State, power2, relay3State, power3);

    String jsonLive = "{\"live1\":";
    jsonLive += String(power1, 2);
    jsonLive += ",\"live2\":";
    jsonLive += String(power2, 2);
    jsonLive += ",\"live3\":";
    jsonLive += String(power3, 2);
    jsonLive += ",\"relay\":";
    jsonLive += String(relay1State);
    jsonLive += ",\"relay2\":";
    jsonLive += String(relay2State);
    jsonLive += ",\"relay3\":";
    jsonLive += String(relay3State);
    jsonLive += "}";

    webSocket.broadcastTXT(jsonLive);

    Serial.println("-----------------------");
    Serial.printf("1: 20A=%.3f, 5A=%.3f / Merged=%.3fA -> %.1fW\n", c1_20, c1_5, current1, power1);
    Serial.printf("2: 20A=%.3f, 5A=%.3f / Merged=%.3fA -> %.1fW\n", c2_20, c2_5, current2, power2);
    Serial.printf("3: 20A=%.3f, 5A=%.3f / Merged=%.3fA -> %.1fW\n", c3_20, c3_5, current3, power3);
    Serial.println("-----------------------");

    // Add data
    sumForMinute[0] += power1;
    sumForMinute[1] += power2;
    sumForMinute[2] += power3;
    countForMinute++;

    struct tm timeinfo;
    if (getLocalTime(&timeinfo))
    {
      // New minute
      if (timeinfo.tm_min != lastMinute)
      {
        float avgMinute[3];
        for (int i = 0; i < 3; i++)
          avgMinute[i] = (countForMinute > 0) ? sumForMinute[i] / countForMinute : 0;

        addToRamMinutes(avgMinute[0], avgMinute[1], avgMinute[2]);

        Serial.printf("(RAM) Minute saved. P1: %.2f P2: %.2f P3: %.2f\n", avgMinute[0], avgMinute[1], avgMinute[2]);

        for (int i = 0; i < 3; i++)
        {
          sumFor15Min[i] += avgMinute[i];
          sumForMinute[i] = 0;
        }
        countFor15Min++;
        countForMinute = 0;

        // New 15min period
        if (timeinfo.tm_min % savePeriod == 0)
        {
          float avg15[3];
          for (int i = 0; i < 3; i++)
            avg15[i] = (countFor15Min > 0) ? sumFor15Min[i] / countFor15Min : 0;

          addTo24hBuffer(avg15[0], avg15[1], avg15[2]);

          time_t now;
          time(&now);
          saveLastWriteTime(now);

          for (int i = 0; i < 3; i++)
          {
            sumForDay[i] += avg15[i];
            sumFor15Min[i] = 0;
          }
          countForDay++;

          Serial.println("\nFLASH SAVE PERIODIC");
          countFor15Min = 0;
        }
        lastMinute = timeinfo.tm_min;
      }

      // New day
      if (timeinfo.tm_mday != lastDay && lastDay != -1)
      {
        float avgDay[3];
        for (int i = 0; i < 3; i++)
          avgDay[i] = (countForDay > 0) ? sumForDay[i] / countForDay : 0;

        addTo31dBuffer(avgDay[0], avgDay[1], avgDay[2]);

        for (int i = 0; i < 3; i++)
        {
          sumForMonth[i] += avgDay[i];
          sumForDay[i] = 0;
        }
        countForMonth++;
        Serial.println("(flash) Day saved.");
        countForDay = 0;

        // New month
        if (timeinfo.tm_mon != lastMonth && lastMonth != -1)
        {
          float avgMonth[3];
          for (int i = 0; i < 3; i++)
            avgMonth[i] = (countForMonth > 0) ? sumForMonth[i] / countForMonth : 0;

          addToMonthsBuffer(avgMonth[0], avgMonth[1], avgMonth[2]);
          Serial.println("(flash) Month saved.");

          for (int i = 0; i < 3; i++)
            sumForMonth[i] = 0;
          countForMonth = 0;
        }
        lastMonth = timeinfo.tm_mon;
      }
      lastDay = timeinfo.tm_mday;
    }
  }
}