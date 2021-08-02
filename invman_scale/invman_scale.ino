#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include "HX711.h"

#define POST_INTERVAL 10

#define LOADCELL_DOUT_PIN 2
#define LOADCELL_SCK_PIN 3

#define SERVER_IP "192.168.0.6:8000"

#ifndef STASSID
#define STASSID "NETGEAR"
#define STAPSK  ""
#endif

HX711 scale;
long reading;

void setup() {

  Serial.begin(115200);
  delay(100);
  Serial.println("[InvMan ESP8266]");

  scale.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);

  while (!scale.is_ready());
  reading = scale.read_average(20);
  Serial.print("Reading: ");
  Serial.println(reading);

  WiFi.begin(STASSID, STAPSK);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.println("Connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
  Serial.print("MAC address: ");
  Serial.println(WiFi.macAddress());

  WiFiClient client;
  HTTPClient http;

  Serial.print("[HTTP] begin...\n");
  http.begin(client, "http://" SERVER_IP "/api/scales"); //HTTP
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Payload-Address", WiFi.macAddress());

  Serial.println("[HTTP] POST...");
  char json[1024];
  char *pos = json;
  pos += sprintf(pos, "{\"val\": \"%i\"}", reading);
  int httpCode = http.POST(json);

  // httpCode will be negative on error
  if (httpCode > 0) {
    Serial.printf("[HTTP] POST... code: %d\n", httpCode);

    if (httpCode == HTTP_CODE_OK) {
      const String& payload = http.getString();
      Serial.println("received payload:\n<<");
      Serial.println(payload);
      Serial.println(">>");
    }
  } else {
    Serial.printf("[HTTP] POST... failed, error: %s\n", http.errorToString(httpCode).c_str());
  }

  http.end();
  WiFi.disconnect();

  Serial.println("Sleepy time");
  ESP.deepSleep(POST_INTERVAL * 1000000);
}

void loop() {
  
}
