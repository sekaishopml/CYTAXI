# 🚕 CYTAXI - Plataforma de Transporte Exclusivo

Plataforma de transporte privado con bot de WhatsApp como canal principal para pasajeros.

## 📋 Resumen

- **Pasajeros**: Solicitan viajes por WhatsApp (sin app adicional)
- **Conductores**: Gestión desde app móvil (Android/iOS)
- **Central**: Dashboard web con mapa en tiempo real

## 🏗️ Arquitectura

```
CYTAXI/
├── packages/
│   ├── shared/               # Tipos, clientes, utilidades
│   ├── bot-whatsapp/         # Bot Baileys v7 + Elysia
│   ├── ride-service/         # Gestión de viajes
│   ├── driver-service/       # Gestión de conductores
│   ├── matching-engine/      # Asignación con Redis GEO
│   ├── notification-service/ # Notificaciones push
│   ├── geocoder-service/     # Nominatim + Redis cache
│   ├── web-central/          # Dashboard SvelteKit
│   ├── app-conductor/        # App Capacitor + Svelte
│   └── pwa-ubicacion/        # Mini web GPS
└── tools/                    # Scripts de deploy
```

## 🛠️ Stack Tecnológico

| Componente | Tecnología |
|------------|------------|
| Runtime | Bun |
| Backend | Elysia (Bun) |
| Frontend | SvelteKit |
| App Móvil | Capacitor + Svelte |
| Mensajería | NATS |
| Base de Datos | PostgreSQL + PostGIS |
| Caché | Redis |
| Mapas | Leaflet + OpenStreetMap |

## 🚀 Inicio Rápido

### Prerrequisitos

- [Bun](https://bun.sh/) v1.0+
- [Docker](https://www.docker.com/) y Docker Compose
- Git

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/sekaishopml/CYTAXI.git
cd CYTAXI

# Instalar dependencias
bun install

# Iniciar servicios base (PostgreSQL, Redis, NATS)
docker-compose up -d

# Esperar a que los servicios estén listos
sleep 10

# Inicializar base de datos
docker exec -i cytaxi-postgres psql -U cytaxi -d cytaxi < tools/seed-db.sql
```

### Desarrollo

```bash
# Iniciar todos los servicios en modo desarrollo
bun run dev:all

# O iniciar servicios individuales
bun run dev:bot        # Bot WhatsApp
bun run dev:ride       # Ride Service
bun run dev:driver     # Driver Service
bun run dev:matching   # Matching Engine
bun run dev:notification # Notification Service
bun run dev:geocoder   # Geocoder Service
bun run dev:dashboard  # Dashboard Web
```

### Puertos

| Servicio | Puerto |
|----------|--------|
| Dashboard | 3000 |
| Bot WhatsApp | 3001 |
| Ride Service | 3002 |
| Driver Service | 3003 |
| Matching Engine | 3004 |
| Notification Service | 3005 |
| Geocoder Service | 3006 |
| PostgreSQL | 5432 |
| Redis | 6379 |
| NATS | 4222 |
| PgAdmin | 5050 |
| Redis Commander | 8081 |

## 📖 Documentación

### Estructura del Proyecto

Ver [docs/architecture.md](docs/architecture.md) para detalles de la arquitectura.

### Plan de Sprints

Ver [docs/sprints/](docs/sprints/) para el plan de desarrollo Scrum.

## 🔧 Configuración

### Variables de Entorno

Copia `.env.example` a `.env` y configura:

```bash
cp .env.example .env
```

Variables principales:

- `DATABASE_URL`: Conexión a PostgreSQL
- `REDIS_URL`: Conexión a Redis
- `NATS_URL`: Conexión a NATS
- `WHATSAPP_PHONE_NUMBER`: Número del bot

### Docker

Para servicios en producción:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 🧪 Pruebas

```bash
# Ejecutar todas las pruebas
bun test

# Pruebas de un paquete específico
bun test --cwd packages/ride-service
```

## 📦 Construcción

```bash
# Construir todos los paquetes
bun run build:all

# Construir un paquete específico
bun run --cwd packages/ride-service build
```

## 🚢 Despliegue

### Oracle Cloud (Gratuito)

1. Crear instancia ARM Always Free
2. Instalar Docker y Docker Compose
3. Clonar repositorio
4. Ejecutar `./tools/deploy.sh`

### Docker

```bash
# Construir imágenes
docker build -t cytaxi-bot ./packages/bot-whatsapp
docker build -t cytaxi-ride ./packages/ride-service
# ... etc

# Ejecutar
docker run -d --name cytaxi-bot cytaxi-bot
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crear branch (`git checkout -b feature/nueva-funcionalidad`)
3. Commit (`git commit -m 'Add nueva funcionalidad'`)
4. Push (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

## 📄 Licencia

MIT License - Ver [LICENSE](LICENSE)

## 📞 Soporte

- GitHub Issues: https://github.com/sekaishopml/CYTAXI/issues
- Email: dev@dmujeres.com

---

**CYTAXI** © 2026 - Plataforma de Transporte Exclusivo
