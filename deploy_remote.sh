#!/bin/bash
set -e

echo "Starting deployment configuration..."

# Configure Nginx
echo "Configuring Nginx..."
cat > /etc/nginx/sites-available/reservo.app.br << 'EOF'
server {
    listen 80;
    server_name reservo.app.br;

    root /var/www/reservo.app.br/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Link and Reload Nginx
ln -sf /etc/nginx/sites-available/reservo.app.br /etc/nginx/sites-enabled/
# Remove default only if it exists
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

# Start/Restart PM2
echo "Configuring PM2..."
cd /var/www/reservo.app.br
pm2 start src/server.js --name reservo-api --update-env || pm2 restart reservo-api --update-env
pm2 save
pm2 startup | bash || true # Try to startup, ignore error if already done

# Setup SSL
echo "Setting up SSL..."
certbot --nginx -d reservo.app.br --non-interactive --agree-tos -m wellingtonmacedos@gmail.com --redirect

echo "Deployment configuration completed successfully!"
