#!/bin/bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 20
nvm use 20
npm install -g pm2

cd /var/www/reservo.app.br
npm install

cd frontend
npm install
npm run build
cd ..

pm2 delete all || true
pm2 start src/server.js --name "reservo-app"
pm2 save
