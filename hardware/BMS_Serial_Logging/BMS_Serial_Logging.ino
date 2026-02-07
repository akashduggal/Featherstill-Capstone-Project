void setup() {
  Serial.begin(115200); // Wired connection speed
  Serial.println("Task #36: Verification Starting...");
}

void loop() {
  // Mock battery values from the Fetherstill BMS snapshot
  Serial.println("BMS Snapshot: V=54.84V, A=3.099A, T=26.95C");
  delay(2000); 
}
