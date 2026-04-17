#!/bin/bash
set -e
export DEBIAN_FRONTEND=noninteractive
echo "========= 1. SYSTEM UPDATE ========="
apt-get update -y
apt-get install -y curl git ufw nginx wget
echo "========= 2. INSTALL NODEJS & PM2 ========="
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm install -g pm2
echo "========= 3. SETUP FIREWALL ========="
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 5000/tcp
echo "y" | ufw enable
echo "========= 4. CLONE PROJECT ========="
cd /root
rm -rf Aura-Profile
git clone https://github.com/8w6s/Aura-Profile.git
cd Aura-Profile
npm install
echo "NEXT_PUBLIC_SUPABASE_URL=YOUR_URL" > .env
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_KEY" >> .env
echo "========= 5. BUILD PROJECT ========="
npm run build
echo "========= 6. START NEXT.JS ========="
pm2 delete aura-profile || true
PORT=5000 HOST=0.0.0.0 pm2 start npm --name "aura-profile" -- start
pm2 save
env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root || true
pm2 save
echo "========= 7. CONFIGURE NGINX ========="
cat << 'NGINX_EOF' > /etc/nginx/sites-available/aura-profile
server {
    listen 80;
    server_name _; 
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX_EOF
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/aura-profile /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
echo "========= ALL DONE! ========="
