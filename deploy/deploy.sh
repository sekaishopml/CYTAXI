#!/bin/bash

# CYTAXI Production Deployment Script
# For Oracle Cloud Always Free

set -e

echo "🚀 CYTAXI Production Deployment"
echo "================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run as root${NC}"
  exit 1
fi

# Update system
echo -e "${YELLOW}Updating system packages...${NC}"
apt-get update && apt-get upgrade -y

# Install Docker
echo -e "${YELLOW}Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com -o get-docker.sh
  sh get-docker.sh
  rm get-docker.sh
fi

# Install Docker Compose
echo -e "${YELLOW}Installing Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
  curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  chmod +x /usr/local/bin/docker-compose
fi

# Create deployment directory
echo -e "${YELLOW}Creating deployment directory...${NC}"
mkdir -p /opt/cytaxi
mkdir -p /opt/cytaxi/ssl
mkdir -p /opt/cytaxi/data

# Copy files
echo -e "${YELLOW}Copying deployment files...${NC}"
cp -r . /opt/cytaxi/

# Generate self-signed SSL certificate (for testing)
echo -e "${YELLOW}Generating SSL certificate...${NC}"
if [ ! -f /opt/cytaxi/ssl/cert.pem ]; then
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /opt/cytaxi/ssl/key.pem \
    -out /opt/cytaxi/ssl/cert.pem \
    -subj "/C=EC/ST=Quito/L=Quito/O=CYTAXI/CN=localhost"
fi

# Create .env file
echo -e "${YELLOW}Creating environment file...${NC}"
if [ ! -f /opt/cytaxi/.env ]; then
  cat > /opt/cytaxi/.env << EOF
# Database
DB_PASSWORD=$(openssl rand -base64 32)

# NATS
NATS_URL=nats://nats:4222

# Redis
REDIS_URL=redis://redis:6379

# Services
BOT_PORT=3001
RIDE_PORT=3002
DRIVER_PORT=3003
MATCHING_PORT=3004
NOTIFICATION_PORT=3005
GEOCODER_PORT=3006
TRACKING_PORT=3007
DASHBOARD_PORT=3008

# WhatsApp
WHATSAPP_SESSION_PATH=/opt/cytaxi/data/whatsapp
EOF
fi

# Start services
echo -e "${YELLOW}Starting services...${NC}"
cd /opt/cytaxi
docker-compose -f deploy/docker-compose.prod.yml up -d --build

# Wait for services
echo -e "${YELLOW}Waiting for services to start...${NC}"
sleep 30

# Check health
echo -e "${YELLOW}Checking service health...${NC}"
docker-compose -f deploy/docker-compose.prod.yml ps

# Create systemd service
echo -e "${YELLOW}Creating systemd service...${NC}"
cat > /etc/systemd/system/cytaxi.service << EOF
[Unit]
Description=CYTAXI Transportation Platform
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/cytaxi
ExecStart=/usr/local/bin/docker-compose -f deploy/docker-compose.prod.yml up -d
ExecStop=/usr/local/bin/docker-compose -f deploy/docker-compose.prod.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable cytaxi.service

echo ""
echo -e "${GREEN}✅ CYTAXI deployment complete!${NC}"
echo ""
echo "📱 Dashboard: https://localhost"
echo "📊 API Docs: https://localhost:3002/swagger"
echo ""
echo "To check status: docker-compose -f deploy/docker-compose.prod.yml ps"
echo "To view logs: docker-compose -f deploy/docker-compose.prod.yml logs -f"
echo "To stop: docker-compose -f deploy/docker-compose.prod.yml down"
