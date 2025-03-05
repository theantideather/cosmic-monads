#!/bin/bash

# Cosmic Monads Backend Deployment Script
# This script helps set up the backend server for Cosmic Monads

echo "=== Cosmic Monads Backend Deployment ==="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root or with sudo"
  exit 1
fi

# Update system
echo "Updating system packages..."
apt update && apt upgrade -y

# Install Node.js
echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install Git
echo "Installing Git..."
apt-get install -y git

# Install PM2
echo "Installing PM2..."
npm install -g pm2

# Clone repository
echo "Cloning repository..."
if [ -d "/opt/cosmic-monads" ]; then
  echo "Directory already exists. Updating..."
  cd /opt/cosmic-monads
  git pull
else
  git clone https://github.com/theantideather/cosmic-monads.git /opt/cosmic-monads
  cd /opt/cosmic-monads
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Create .env file
echo "Setting up environment variables..."
if [ ! -f ".env" ]; then
  echo "Creating .env file..."
  cat > .env << EOF
# Deployment Account Private Key (without 0x prefix)
# Replace with your actual private key
PRIVATE_KEY=

# Monad Testnet RPC URL
MONAD_TESTNET_RPC=https://testnet-rpc.monad.xyz/

# Contract address on Monad Testnet
CONTRACT_ADDRESS=0x37Ea645D9CA096ecAAbf23c9Ed1b589f68198957

# Server Configuration
THROTTLE_INTERVAL=5000
MAX_TX_PER_MINUTE=10
WALLET_ADDRESS=0x5f8cD364Eae5F793C5DF8E4545C2a8fA4f55b23a
EOF

  echo "Please edit the .env file to add your private key:"
  echo "nano /opt/cosmic-monads/.env"
else
  echo ".env file already exists. Skipping..."
fi

# Set up PM2
echo "Setting up PM2 service..."
pm2 start server.js --name cosmic-monads
pm2 save
pm2 startup

# Install Nginx
echo "Installing and configuring Nginx..."
apt install -y nginx

# Create Nginx config
cat > /etc/nginx/sites-available/cosmic-monads << EOF
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/cosmic-monads /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx

# Set up firewall
echo "Configuring firewall..."
apt install -y ufw
ufw allow ssh
ufw allow http
ufw allow https
ufw --force enable

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "Next steps:"
echo "1. Edit your .env file to add your private key: nano /opt/cosmic-monads/.env"
echo "2. Restart the service: pm2 restart cosmic-monads"
echo "3. Set up SSL with: sudo certbot --nginx"
echo ""
echo "Your server is running at: http://$(hostname -I | awk '{print $1}')"
echo "" 