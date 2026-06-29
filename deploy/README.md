# CYTAXI Deployment Guide

## Overview
This guide covers deploying CYTAXI on Oracle Cloud Always Free tier.

## Prerequisites
- Oracle Cloud account with Always Free tier
- Ubuntu 20.04+ server
- Domain name (optional, for SSL)

## Quick Deploy

### 1. SSH into your server
```bash
ssh ubuntu@your-server-ip
```

### 2. Clone the repository
```bash
git clone https://github.com/sekaishopml/CYTAXI.git
cd CYTAXI
```

### 3. Run deployment script
```bash
sudo bash deploy/deploy.sh
```

### 4. Access the platform
- Dashboard: `https://your-server-ip`
- API: `https://your-server-ip:3002`

## Manual Deployment

### 1. Install Docker
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

### 2. Install Docker Compose
```bash
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### 3. Configure environment
```bash
cp .env.example .env
# Edit .env with your settings
```

### 4. Start services
```bash
docker-compose -f deploy/docker-compose.prod.yml up -d
```

## SSL Certificate

### For production, use Let's Encrypt:
```bash
# Install certbot
apt-get install certbot

# Get certificate
certbot certonly --standalone -d your-domain.com

# Copy to deploy/ssl/
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem deploy/ssl/cert.pem
cp /etc/letsencrypt/live/your-domain.com/privkey.pem deploy/ssl/key.pem
```

## Monitoring

### Check service status
```bash
docker-compose -f deploy/docker-compose.prod.yml ps
```

### View logs
```bash
docker-compose -f deploy/docker-compose.prod.yml logs -f
```

### Restart services
```bash
docker-compose -f deploy/docker-compose.prod.yml restart
```

## Backup

### Database backup
```bash
docker exec cytaxi-postgres pg_dump -U cytaxi cytaxi > backup.sql
```

### Restore database
```bash
cat backup.sql | docker exec -i cytaxi-postgres psql -U cytaxi -d cytaxi
```

## Troubleshooting

### Service won't start
```bash
# Check logs
docker-compose -f deploy/docker-compose.prod.yml logs service-name

# Check if port is in use
lsof -i :3002
```

### Database connection issues
```bash
# Test connection
docker exec -it cytaxi-postgres psql -U cytaxi -d cytaxi
```

### NATS connection issues
```bash
# Check NATS status
docker exec -it cytaxi-nats nats-server --signal ldm=localhost:8222
```

## Performance Tuning

### Oracle Cloud Always Free Limits
- 1 GB RAM (shared)
- 2 OCPUs
- 47 GB storage

### Recommendations
- Use Redis for caching
- Enable gzip compression
- Use connection pooling
- Monitor resource usage

## Security

### Change default passwords
```bash
# Edit .env file
DB_PASSWORD=your-secure-password
```

### Enable firewall
```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### Regular updates
```bash
# Update system
apt-get update && apt-get upgrade -y

# Update Docker images
docker-compose -f deploy/docker-compose.prod.yml pull
docker-compose -f deploy/docker-compose.prod.yml up -d
```
