export DEBIAN_FRONTEND=noninteractive
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get update && apt-get install -y nodejs git > /dev/null 2>&1
npm install -g pm2 > /dev/null 2>&1
rm -rf Aura-Profile
git clone https://github.com/8w6s/Aura-Profile.git
cd Aura-Profile
npm install > /dev/null 2>&1
npm run build
pm2 delete aura-profile || true
PORT=5000 pm2 start npm --name aura-profile -- start
pm2 save > /dev/null 2>&1
