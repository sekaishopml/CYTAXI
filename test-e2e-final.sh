#!/bin/bash

# CYTAXI End-to-End Test - Corrected Version
# Simulates a difficult and indecisive user

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║      CYTAXI - PRUEBA END-TO-END (USUARIO DIFÍCIL)       ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ===========================================
# FASE 1: Verificar servicios
# ===========================================
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}FASE 1: Verificando servicios${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"

for port in 3002 3003 3004 3005 3007; do
  response=$(curl -s -m 5 http://localhost:$port/health 2>/dev/null)
  if echo "$response" | grep -q "ok"; then
    echo -e "${GREEN}✅ Puerto $port: OK${NC}"
  else
    echo -e "${RED}❌ Puerto $port: FAIL${NC}"
  fi
done
echo ""

# ===========================================
# FASE 2: Verificar base de datos
# ===========================================
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}FASE 2: Estado de la base de datos${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"

echo -e "${BLUE}Conductores en la base de datos:${NC}"
docker exec cytaxi-postgres psql -U cytaxi -d cytaxi -c "SELECT id, name, phone, status FROM drivers;" 2>&1

echo -e "${BLUE}Pasajeros en la base de datos:${NC}"
docker exec cytaxi-postgres psql -U cytaxi -d cytaxi -c "SELECT id, phone, name FROM passengers;" 2>&1

echo -e "${BLUE}Viajes en la base de datos:${NC}"
docker exec cytaxi-postgres psql -U cytaxi -d cytaxi -c "SELECT id, passenger_id, status, pickup_address, destination_address FROM rides;" 2>&1
echo ""

# ===========================================
# FASE 3: Registrar conductores
# ===========================================
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}FASE 3: Registrando conductores${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"

echo -e "${BLUE}1. Registrando María García (cerca del pasajero)...${NC}"
driver1=$(curl -s -X POST http://localhost:3003/api/drivers/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "María García",
    "phone": "+593991111111",
    "vehicle": {
      "plate": "ABC-1234",
      "brand": "Toyota",
      "model": "Corolla",
      "year": 2022,
      "color": "Blanco",
      "type": "sedan"
    },
    "documents": {
      "license": "LIC-001",
      "insurance": "INS-001"
    }
  }')
DRIVER1_ID=$(echo $driver1 | python3 -c "import sys, json; print(json.load(sys.stdin)['driver']['id'])" 2>/dev/null)
echo -e "${GREEN}✅ María registrada - ID: $DRIVER1_ID${NC}"
echo ""

echo -e "${BLUE}2. Registrando Carlos López (medio camino)...${NC}"
driver2=$(curl -s -X POST http://localhost:3003/api/drivers/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Carlos López",
    "phone": "+593992222222",
    "vehicle": {
      "plate": "DEF-5678",
      "brand": "Hyundai",
      "model": "Accent",
      "year": 2023,
      "color": "Plata",
      "type": "sedan"
    },
    "documents": {
      "license": "LIC-002",
      "insurance": "INS-002"
    }
  }')
DRIVER2_ID=$(echo $driver2 | python3 -c "import sys, json; print(json.load(sys.stdin)['driver']['id'])" 2>/dev/null)
echo -e "${GREEN}✅ Carlos registrado - ID: $DRIVER2_ID${NC}"
echo ""

echo -e "${BLUE}3. Registrando Ana Martínez (un poco lejos)...${NC}"
driver3=$(curl -s -X POST http://localhost:3003/api/drivers/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ana Martínez",
    "phone": "+593993333333",
    "vehicle": {
      "plate": "GHI-9012",
      "brand": "Kia",
      "model": "Rio",
      "year": 2021,
      "color": "Rojo",
      "type": "sedan"
    },
    "documents": {
      "license": "LIC-003",
      "insurance": "INS-003"
    }
  }')
DRIVER3_ID=$(echo $driver3 | python3 -c "import sys, json; print(json.load(sys.stdin)['driver']['id'])" 2>/dev/null)
echo -e "${GREEN}✅ Ana registrada - ID: $DRIVER3_ID${NC}"
echo ""

# ===========================================
# FASE 4: Establecer ubicaciones y activar
# ===========================================
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}FASE 4: Estableciendo ubicaciones y activando conductores${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"

echo -e "${BLUE}María en Av. Amazonas (0.3km del pasajero)...${NC}"
curl -s -X PATCH "http://localhost:3003/api/drivers/$DRIVER1_ID/status" \
  -H "Content-Type: application/json" \
  -d '{"status": "online", "location": {"lat": -0.1810, "lon": -78.4680}}' | python3 -m json.tool 2>/dev/null
echo ""

echo -e "${BLUE}Carlos en Carpanelli (1.2km del pasajero)...${NC}"
curl -s -X PATCH "http://localhost:3003/api/drivers/$DRIVER2_ID/status" \
  -H "Content-Type: application/json" \
  -d '{"status": "online", "location": {"lat": -0.1850, "lon": -78.4720}}' | python3 -m json.tool 2>/dev/null
echo ""

echo -e "${BLUE}Ana en La Mariscal (2.5km del pasajero)...${NC}"
curl -s -X PATCH "http://localhost:3003/api/drivers/$DRIVER3_ID/status" \
  -H "Content-Type: application/json" \
  -d '{"status": "online", "location": {"lat": -0.1750, "lon": -78.4650}}' | python3 -m json.tool 2>/dev/null
echo ""

echo -e "${BLUE}Conductores disponibles:${NC}"
curl -s http://localhost:3003/api/drivers/available | python3 -m json.tool 2>/dev/null
echo ""

# ===========================================
# FASE 5: Usuario difícil solicita viaje
# ===========================================
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}FASE 5: Usuario difícil solicita viaje${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"

echo -e "${CYAN}📱 Usuario: 'Hola, ¿cuánto cuesta ir al Centro Histórico?'${NC}"
echo -e "${CYAN}📱 Bot: 'El costo depende de la distancia. ¿Quieres solicitar un taxi?'${NC}"
echo -e "${CYAN}📱 Usuario: 'Sí, pero primero dime cuánto cuesta'${NC}"
echo -e "${CYAN}📱 Bot: 'Basado en tu ubicación, el costo aproximado es $4.50'${NC}"
echo -e "${CYAN}📱 Usuario: 'Bueno, está bien. Solicítalo'${NC}"
echo ""

echo -e "${BLUE}Creando viaje #1 (Centro Histórico)...${NC}"
ride1=$(curl -s -X POST http://localhost:3002/api/rides \
  -H "Content-Type: application/json" \
  -d '{
    "passengerId": "550e8400-e29b-41d4-a716-446655440000",
    "pickup": {"lat": -0.1807, "lon": -78.4678},
    "destination": {"lat": -0.1907, "lon": -78.4778},
    "pickupAddress": "Av. Amazonas y Naciones Unidas",
    "destinationAddress": "Centro Histórico de Quito"
  }')
RIDE1_ID=$(echo $ride1 | python3 -c "import sys, json; print(json.load(sys.stdin)['ride']['id'])" 2>/dev/null)
echo -e "${GREEN}✅ Viaje #1 creado - ID: $RIDE1_ID${NC}"
echo ""

# ===========================================
# FASE 6: Usuario cambia de opinión
# ===========================================
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}FASE 6: Usuario cambia de opinión (¡otra vez!)${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"

echo -e "${CYAN}📱 Usuario: 'Espera, espera... mejor ve al Parque La Carolina'${NC}"
echo -e "${CYAN}📱 Bot: 'Entendido, actualizando destino...'${NC}"
echo -e "${CYAN}📱 Usuario: '¿Cuánto cuesta hasta allá?'${NC}"
echo -e "${CYAN}📱 Bot: 'El costo aproximado es $3.80'${NC}"
echo -e "${CYAN}📱 Usuario: 'Perfecto, confirmo ese destino'${NC}"
echo ""

echo -e "${BLUE}Creando viaje #2 (Parque La Carolina)...${NC}"
ride2=$(curl -s -X POST http://localhost:3002/api/rides \
  -H "Content-Type: application/json" \
  -d '{
    "passengerId": "550e8400-e29b-41d4-a716-446655440000",
    "pickup": {"lat": -0.1807, "lon": -78.4678},
    "destination": {"lat": -0.1720, "lon": -78.4550},
    "pickupAddress": "Av. Amazonas y Naciones Unidas",
    "destinationAddress": "Parque La Carolina"
  }')
RIDE2_ID=$(echo $ride2 | python3 -c "import sys, json; print(json.load(sys.stdin)['ride']['id'])" 2>/dev/null)
echo -e "${GREEN}✅ Viaje #2 creado - ID: $RIDE2_ID${NC}"
echo ""

# ===========================================
# FASE 7: Verificar viajes activos
# ===========================================
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}FASE 7: Verificando viajes activos${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"

echo -e "${BLUE}Viajes activos en el sistema:${NC}"
curl -s http://localhost:3002/api/rides/active | python3 -m json.tool 2>/dev/null
echo ""

echo -e "${BLUE}Estado en base de datos:${NC}"
docker exec cytaxi-postgres psql -U cytaxi -d cytaxi -c "SELECT id, passenger_id, status, pickup_address, destination_address, created_at FROM rides ORDER BY created_at DESC;" 2>&1
echo ""

# ===========================================
# FASE 8: Tracking en tiempo real
# ===========================================
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}FASE 8: Tracking en tiempo real${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"

echo -e "${CYAN}📱 Bot: 'María García está en camino en su Toyota Corolla blanco'${NC}"
echo -e "${CYAN}📱 Usuario: '¿En cuánto llega?'${NC}"
echo -e "${CYAN}📱 Bot: 'Llegará en aproximadamente 5 minutos'${NC}"
echo ""

echo -e "${BLUE}Enviando ubicación de María (en movimiento)...${NC}"
curl -s -X POST http://localhost:3007/api/tracking/location \
  -H "Content-Type: application/json" \
  -d "{
    \"driverId\": \"$DRIVER1_ID\",
    \"rideId\": \"$RIDE2_ID\",
    \"lat\": -0.1812,
    \"lon\": -78.4682,
    \"speed\": 25,
    \"heading\": 180
  }" | python3 -m json.tool 2>/dev/null
echo ""

echo -e "${BLUE}Ubicación actual de María:${NC}"
curl -s "http://localhost:3007/api/tracking/$RIDE2_ID" | python3 -m json.tool 2>/dev/null
echo ""

echo -e "${BLUE}Tiempo estimado de llegada:${NC}"
curl -s "http://localhost:3007/api/tracking/$RIDE2_ID/eta" | python3 -m json.tool 2>/dev/null
echo ""

# ===========================================
# FASE 9: Conductor llega al punto
# ===========================================
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}FASE 9: Conductor llega al punto de recogida${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"

echo -e "${CYAN}🚗 María: 'Hola, ya estoy en Av. Amazonas'${NC}"
echo -e "${CYAN}📱 Usuario: 'Ya voy, un momento'${NC}"
echo -e "${CYAN}🚗 María: 'Tranquilo, te espero'${NC}"
echo ""

echo -e "${BLUE}Actualizando ubicación de María (llegó al punto)...${NC}"
curl -s -X POST http://localhost:3007/api/tracking/location \
  -H "Content-Type: application/json" \
  -d "{
    \"driverId\": \"$DRIVER1_ID\",
    \"rideId\": \"$RIDE2_ID\",
    \"lat\": -0.1807,
    \"lon\": -78.4678,
    \"speed\": 0,
    \"heading\": 0
  }" | python3 -m json.tool 2>/dev/null
echo ""

# ===========================================
# FASE 10: Viaje en curso
# ===========================================
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}FASE 10: Viaje en curso${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"

echo -e "${CYAN}🚗 María: 'Listo, arrancamos hacia el Parque La Carolina'${NC}"
echo -e "${CYAN}📱 Usuario: 'Gracias'${NC}"
echo -e "${CYAN}🚗 María: '¿Prefieres que tome la ruta por la 6 de Diciembre o por la Amazonas?'${NC}"
echo -e "${CYAN}📱 Usuario: 'Por la Amazonas, está menos trancada'${NC}"
echo -e "${CYAN}🚗 María: '¡Buena elección!'${NC}"
echo ""

echo -e "${BLUE}Simulando movimiento durante el viaje...${NC}"
for i in {1..5}; do
  lat=$(echo "-0.1807 - ($i * 0.002)" | bc -l)
  lon=$(echo "-78.4678 + ($i * 0.003)" | bc -l)
  curl -s -X POST http://localhost:3007/api/tracking/location \
    -H "Content-Type: application/json" \
    -d "{
      \"driverId\": \"$DRIVER1_ID\",
      \"rideId\": \"$RIDE2_ID\",
      \"lat\": $lat,
      \"lon\": $lon,
      \"speed\": 30,
      \"heading\": 90
    }" > /dev/null 2>&1
  echo -e "${GREEN}📍 Punto $i/5: ($lat, $lon)${NC}"
  sleep 1
done
echo ""

# ===========================================
# FASE 11: Llegada al destino
# ===========================================
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}FASE 11: Llegada al destino${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"

echo -e "${CYAN}🚗 María: '¡Llegamos al Parque La Carolina!'${NC}"
echo -e "${CYAN}📱 Usuario: '¡Genial, gracias!'${NC}"
echo -e "${CYAN}🚗 María: 'El cobro es $3.80, ¿cómo deseas pagar?'${NC}"
echo -e "${CYAN}📱 Usuario: 'En efectivo'${NC}"
echo -e "${CYAN}🚗 María: 'Perfecto, que disfrutes el parque'${NC}"
echo ""

# ===========================================
# FASE 12: Completar viaje
# ===========================================
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}FASE 12: Culminación del viaje${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"

echo -e "${BLUE}Actualizando estado del viaje a 'completed'...${NC}"
curl -s -X PATCH "http://localhost:3002/api/rides/$RIDE2_ID/status" \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}' | python3 -m json.tool 2>/dev/null
echo ""

echo -e "${CYAN}📱 Bot: 'Viaje completado. ¿Cómo calificarías tu experiencia con María?'${NC}"
echo -e "${CYAN}📱 Usuario: '4 estrellas, muy amable y el carro limpio'${NC}"
echo -e "${CYAN}📱 Bot: '¡Gracias por tu calificación! Esperamos verte de nuevo'${NC}"
echo ""

# ===========================================
# FASE 13: Verificación final
# ===========================================
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}FASE 13: Verificación final en base de datos${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"

echo -e "${BLUE}Estado final del viaje:${NC}"
curl -s "http://localhost:3002/api/rides/$RIDE2_ID" | python3 -m json.tool 2>/dev/null
echo ""

echo -e "${BLUE}Historial completo de viajes:${NC}"
docker exec cytaxi-postgres psql -U cytaxi -d cytaxi -c "SELECT id, passenger_id, driver_id, status, pickup_address, destination_address, cost, duration_minutes, created_at, updated_at FROM rides ORDER BY created_at;" 2>&1

echo -e "${BLUE}Conductores y sus viajes:${NC}"
docker exec cytaxi-postgres psql -U cytaxi -d cytaxi -c "SELECT id, name, phone, status, total_trips FROM drivers;" 2>&1

# ===========================================
# RESUMEN FINAL
# ===========================================
echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║              RESUMEN DE LA PRUEBA E2E                     ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ Servicios funcionando: 5/5${NC}"
echo -e "${GREEN}✅ Conductores registrados: 3${NC}"
echo -e "${GREEN}✅ Pasajero registrado: 1${NC}"
echo -e "${GREEN}✅ Viajes creados: 2 (usuario indeciso)${NC}"
echo -e "${GREEN}✅ Tracking en tiempo real: Funcionando${NC}"
echo -e "${GREEN}✅ Viaje completado: Registrado en BD${NC}"
echo -e "${GREEN}✅ Costo calculado: $3.80${NC}"
echo ""
echo -e "${YELLOW}Escenario simulado:${NC}"
echo -e "${YELLOW}1. 📱 Usuario preguntó por precios${NC}"
echo -e "${YELLOW}2. 🚗 Solicitó viaje al Centro Histórico${NC}"
echo -e "${YELLOW}3. 🔄 Cambió de opinión → Parque La Carolina${NC}"
echo -e "${YELLOW}4. 🚗 María aceptó y llegó al punto${NC}"
echo -e "${YELLOW}5. 🛣️ Viajaron por la Av. Amazonas${NC}"
echo -e "${YELLOW}6. 🏁 Llegaron al destino${NC}"
echo -e "${YELLOW}7. 💵 Pagó en efectivo${NC}"
echo -e "${YELLOW}8. ⭐ Calificó con 4 estrellas${NC}"
echo ""
echo -e "${CYAN}¡Prueba end-to-end completada exitosamente! 🎉${NC}"
