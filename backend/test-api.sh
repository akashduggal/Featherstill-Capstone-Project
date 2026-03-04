#!/bin/bash

# ============================================
# Featherstill Backend Quick Test Script
# ============================================
# This script tests all backend endpoints

API_URL="http://localhost:3000"
TEST_EMAIL="test@example.com"
BATTERY_ID="primary-battery"

echo "🧪 Featherstill Backend Test Suite"
echo "=================================="
echo ""

# Test 1: Health Check
echo "1️⃣  Testing /health endpoint..."
curl -s "$API_URL/health" | jq . || echo "❌ Failed"
echo ""
sleep 1

# Test 2: POST Battery Reading
echo "2️⃣  Testing POST /api/battery-readings..."
curl -s -X POST "$API_URL/api/battery-readings" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$TEST_EMAIL'",
    "batteryId": "'$BATTERY_ID'",
    "totalBatteryVoltage": 57.44,
    "cellTemperature": 37.0,
    "currentAmps": -19.83,
    "stateOfCharge": 100,
    "chargingStatus": "INACTIVE",
    "cellVoltages": [3.58, 3.6, 3.59, 3.59, 3.6, 3.60, 3.62, 3.62, 3.59, 3.58, 3.57, 3.58, 3.59, 3.58, 3.58, 3.6]
  }' | jq . || echo "❌ Failed"
echo ""
sleep 1

# Test 3: GET Readings
echo "3️⃣  Testing GET /api/battery-readings/:email..."
curl -s "$API_URL/api/battery-readings/$TEST_EMAIL" | jq . || echo "❌ Failed"
echo ""
sleep 1

# Test 4: GET Latest Reading
echo "4️⃣  Testing GET /api/battery-readings/:email/latest..."
curl -s "$API_URL/api/battery-readings/$TEST_EMAIL/latest" | jq . || echo "❌ Failed"
echo ""
sleep 1

# Test 5: Invalid Email Validation
echo "5️⃣  Testing validation (invalid email)..."
curl -s -X POST "$API_URL/api/battery-readings" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "batteryId": "'$BATTERY_ID'",
    "totalBatteryVoltage": 57.44,
    "cellTemperature": 37.0,
    "currentAmps": -19.83,
    "stateOfCharge": 100,
    "chargingStatus": "INACTIVE"
  }' | jq . || echo "❌ Failed"
echo ""

# Test 6: Invalid Voltage Validation
echo "6️⃣  Testing validation (invalid voltage)..."
curl -s -X POST "$API_URL/api/battery-readings" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$TEST_EMAIL'",
    "batteryId": "'$BATTERY_ID'",
    "totalBatteryVoltage": 150,
    "cellTemperature": 37.0,
    "currentAmps": -19.83,
    "stateOfCharge": 100,
    "chargingStatus": "INACTIVE"
  }' | jq . || echo "❌ Failed"
echo ""

echo "✅ Test suite complete!"
echo ""
echo "If all tests passed, your backend is working correctly! 🎉"
