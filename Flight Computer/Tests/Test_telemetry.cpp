unsigned long seq = 0;

// Startverdier
long alt = 0;        // høyde i meter
float vel = 0;        // m/s
float pitch = 0;
float roll = 0;
float yaw = 0;

// Oppstigningsparametre
float a_up = 10.0; // akselerasjon i m/s² (~1 g ekstra)
float g0 = 9.81;   // gravitasjon i m/s²

void setup() {
  Serial.begin(57600);
  delay(1000);
  randomSeed(analogRead(A0));
}

float pressureAtHeight(float h) {
  if(h < 11000) return 101325 * pow(1 - 0.0065 * h / 288.15, 5.2561);
  else if(h < 20000) return 22632 * exp(-0.000157 * (h-11000));
  else if(h < 32000) return 5474 * pow(1 + 0.001 * (h-20000)/216.65, -34.1632);
  else if(h < 47000) return 868 * pow(1 - 0.0028*(h-32000)/228.65, 12.2016);
  else if(h < 51000) return 110 * exp(-0.000157*(h-47000));
  else if(h < 71000) return 66 * pow(1 - 0.0028*(h-51000)/270.65, -12.2016);
  else return 0.12;
}

float temperatureAtHeight(float h) {
  if(h < 11000) return 15 - 0.0065 * h;
  else if(h < 20000) return -56.5;
  else if(h < 32000) return -56.5 + 0.001*(h-20000);
  else if(h < 47000) return -44.5 + 0.0028*(h-32000);
  else if(h < 51000) return -2.5;
  else if(h < 71000) return -2.5 - 0.0028*(h-51000);
  else return -58.5;
}

void loop() {
  unsigned long t = millis();

  // Små tilfeldige side-aksler
  float ax = random(-20,20)/1000.0;   // -0.02..0.02 g
  float ay = random(-20,20)/1000.0;

  // Hovedaksler i z-retning med g-krefter
  float az = (g0 + a_up)/g0; // g-krefter følt i z-retning (~2 g for a_up=9.81)

  // Små endringer i pitch/roll/yaw – økt volatilitet
  pitch += random(-200,200)/100.0;  // ±2° per loop
  roll  += random(-200,200)/100.0;  // ±2° per loop
  yaw   += random(-400,400)/100.0;  // ±4° per loop

  // Begrens vinkler
  if (pitch > 180) pitch -= 360;
  if (pitch < -180) pitch += 360;
  if (roll > 180) roll -= 360;
  if (roll < -180) roll += 360;
  if (yaw > 360) yaw -= 360;


  // Hastighet og høyde
  vel += a_up * 0.15; // delta v = a * dt, dt ≈ 0.15 s
  if(vel > 2000) vel = 2000; // maks hastighet 2 km/s
  alt += 100;
  if(alt > 100000) alt = 100000;

  // Trykk og temperatur
  float press = pressureAtHeight(alt);
  float temp  = temperatureAtHeight(alt);

  // GPS-koordinater
  long lat = 6039290 + (seq*2); 
  long lon = 532410 + (seq*2);

  // Send CSV: t,seq,ax,ay,az,pitch,roll,yaw,temp,vel,press,lat,lon,alt
  Serial.print(t); Serial.print(',');
  Serial.print(seq++); Serial.print(',');
  Serial.print(ax); Serial.print(',');
  Serial.print(ay); Serial.print(',');
  Serial.print(az); Serial.print(',');
  Serial.print(pitch); Serial.print(',');
  Serial.print(roll); Serial.print(',');
  Serial.print(yaw); Serial.print(',');
  Serial.print(temp); Serial.print(',');
  Serial.print(vel); Serial.print(',');
  Serial.print(press); Serial.print(',');
  Serial.print(lat); Serial.print(',');
  Serial.print(lon); Serial.print(',');
  Serial.print(alt); Serial.print('\n');

  delay(150);
}
