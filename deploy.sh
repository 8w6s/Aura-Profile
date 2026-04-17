curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs git
npm install -g pm2
rm -rf Aura-Profile
git clone https://github.com/8w6s/Aura-Profile.git
cd Aura-Profile
npm install
npm run build
pm2 delete aura-profile || true
PORT=5000 pm2 start npm --name aura-profile -- start
pm2 save
