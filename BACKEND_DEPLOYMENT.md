# Backend Deployment Guide for Cosmic Monads

This guide provides instructions for deploying the Cosmic Monads backend server to a production environment. The frontend is deployed on Netlify, but the backend needs to be deployed separately to handle blockchain transactions.

## Option 1: Deploy to Heroku

### Prerequisites
- A Heroku account
- Heroku CLI installed

### Steps

1. **Create a new Heroku app**
   ```bash
   heroku create cosmic-monads-api
   ```

2. **Set up environment variables**
   ```bash
   heroku config:set PRIVATE_KEY=your_private_key_here
   heroku config:set CONTRACT_ADDRESS=your_contract_address_here
   heroku config:set PORT=80
   ```

3. **Push the code to Heroku**
   ```bash
   git push heroku main
   ```

## Option 2: Deploy to a VPS (Digital Ocean, AWS, etc.)

1. **SSH into your server**
   ```bash
   ssh user@your-server-ip
   ```

2. **Clone the repository**
   ```bash
   git clone https://github.com/theantideather/cosmic-monads.git
   cd cosmic-monads
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Create a .env file**
   ```bash
   cat > .env << EOF
   PRIVATE_KEY=your_private_key_here
   CONTRACT_ADDRESS=your_contract_address_here
   PORT=3001
   EOF
   ```

5. **Use PM2 to manage the process**
   ```bash
   npm install -g pm2
   pm2 start server.js --name cosmic-monads-backend
   pm2 save
   pm2 startup
   ```

6. **Set up Nginx as a reverse proxy**
   ```bash
   sudo apt-get install nginx
   ```

   Create a new nginx config:
   ```bash
   sudo nano /etc/nginx/sites-available/cosmic-monads
   ```

   Add the following:
   ```
   server {
     listen 80;
     server_name your-domain.com;

     location /api/ {
       proxy_pass http://localhost:3001/api/;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

   Enable the site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/cosmic-monads /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

7. **Set up SSL with Let's Encrypt**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

## Updating the Netlify Configuration

Once your backend is deployed, update the redirect in your `netlify.toml` file:

```toml
[[redirects]]
  from = "/api/*"
  to = "https://your-backend-domain.com/api/:splat"
  status = 200
  force = true
```

## Environment Variables

To ensure the security of your private key, always use environment variables and never commit sensitive information to your repository.

| Variable | Description |
|----------|-------------|
| PRIVATE_KEY | Your Monad blockchain private key |
| CONTRACT_ADDRESS | The address of your game contract |
| PORT | The port the server should run on |

## Security Considerations

1. Never share or expose your private key
2. Use HTTPS for all communications
3. Consider implementing rate limiting and IP filtering for your API endpoints
4. Regularly update dependencies for security patches 