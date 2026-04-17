#!/bin/bash
sshpass -p "IO49%u&H8EJJ" ssh -o StrictHostKeyChecking=no root@138.252.133.192 << EOF
set -e
echo "?? Ðang Cài d?t môi tru?ng Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get update && apt-get install -y nodejs git
npm install -g pm2
echo "?? Ðang Clone mã ngu?n..."
rm -rf Aura-Profile
git clone https://github.com/8w6s/Aura-Profile.git
cd Aura-Profile
echo "?? Ðang cài d?t thu vi?n..."
npm install
echo "?? Ðang c?u hình file .env..."
# Ði?n khóa Supabase c?a b?n t?i dây:
echo "NEXT_PUBLIC_SUPABASE_URL=YOUR_URL" > .env
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_KEY" >> .env
echo "??? Ðang Build d? án (bu?c này s? m?t m?t lúc)..."
npm run build
echo "?? Ðang kh?i ch?y Aura Profile ? c?ng 5000 b?ng PM2..."
# Xóa ti?n trình cu n?u có
pm2 delete aura-profile || true
PORT=5000 pm2 start npm --name "aura-profile" -- start
echo "?? Ðua PM2 vào ti?n trình t? b?t trên h? th?ng..."
pm2 save
pm2 startup | tail -n 1 | bash -
echo "? HOÀN T?T!!! D? án dang ch?y t?i http://138.252.133.192:5000"
EOF
