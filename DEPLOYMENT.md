# Cosmic Monads Production Deployment Guide

This guide explains how to set up a secure production backend server for Cosmic Monads that can process real blockchain transactions.

## Overview

The deployment architecture consists of:
1. **Frontend**: Hosted on Netlify (already set up)
2. **Backend**: A dedicated server running the blockchain transaction processing

## Setting Up the Backend Server

### 1. Choose a Server Provider

Select one of these options:
- **DigitalOcean Droplet**: $5-10/month (recommended)
- **AWS EC2**: t2.micro instance (free tier eligible)
- **Heroku**: Basic dyno ($7/month)
- **Railway**: Starter plan ($5/month)

### 2. Server Setup

#### Basic Server Setup (Ubuntu)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Git
sudo apt-get install -y git

# Clone your repository
git clone https://github.com/theantideather/cosmic-monads.git
cd cosmic-monads

# Install dependencies
npm install
```

### 3. Environment Configuration

Create a `.env` file with your production settings:

```
# IMPORTANT: Use a secure private key, different from development
PRIVATE_KEY=your_production_private_key_here

# Monad Testnet RPC URL
MONAD_TESTNET_RPC=https://testnet-rpc.monad.xyz/

# Contract address on Monad Testnet
CONTRACT_ADDRESS=0x37Ea645D9CA096ecAAbf23c9Ed1b589f68198957

# Server Configuration
THROTTLE_INTERVAL=5000
MAX_TX_PER_MINUTE=10
WALLET_ADDRESS=0x5f8cD364Eae5F793C5DF8E4545C2a8fA4f55b23a
```

### 4. Running the Server

#### Option 1: Using PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Start the server
pm2 start server.js --name cosmic-monads

# Make it start on boot
pm2 startup
pm2 save
```

#### Option 2: Using systemd

Create a service file:

```bash
sudo nano /etc/systemd/system/cosmic-monads.service
```

Add the following content:

```
[Unit]
Description=Cosmic Monads Blockchain Server
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/path/to/cosmic-monads
ExecStart=/usr/bin/node server.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl enable cosmic-monads
sudo systemctl start cosmic-monads
```

### 5. Setting Up HTTPS with Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx

# Configure Nginx
sudo nano /etc/nginx/sites-available/cosmic-monads
```

Add the following configuration:

```
server {
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and get SSL certificate:

```bash
sudo ln -s /etc/nginx/sites-available/cosmic-monads /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo certbot --nginx -d your-domain.com
```

### 6. Update Frontend Configuration

Update the `config.js` file in your Netlify deployment:

```js
window.PRODUCTION_API_URL = 'https://your-domain.com/api';
```

## Security Considerations

1. **Private Key Security**:
   - Never commit your private key to Git
   - Consider using a hardware wallet or key management service
   - Regularly rotate your keys

2. **Server Hardening**:
   - Enable a firewall (UFW)
   - Set up fail2ban
   - Keep your server updated

3. **Monitoring**:
   - Set up monitoring with PM2 or a service like UptimeRobot
   - Configure log rotation

## Troubleshooting

### Common Issues

1. **Connection Refused**:
   - Check if the server is running
   - Verify firewall settings

2. **CORS Errors**:
   - Ensure your CORS settings in server.js allow your Netlify domain

3. **Transaction Failures**:
   - Check account balance
   - Verify contract address
   - Check Monad network status

## Maintenance

- Regularly update Node.js and npm packages
- Monitor disk space and server resources
- Back up your .env file securely 