# 🔒 THÔNG TIN DỰ ÁN & BACKUP

## ⚠️ CẢNH BÁO QUAN TRỌNG
**TUYỆT ĐỐI KHÔNG ĐƯỢC ĐỤNG VÀO FOLDER `backup/`**
- Folder `backup/` chứa toàn bộ source code gốc của dự án
- Đây là bản sao lưu cuối cùng - không được sửa, xóa, hoặc di chuyển
- Nếu cần khôi phục, copy từ `backup/` ra ngoài, không làm việc trực tiếp trong đó

---

## 📋 TỔNG QUAN DỰ ÁN

**Tên dự án:** 8w6s Profile  
**Loại:** Personal Portfolio/Profile Website  
**Framework:** Next.js 15+ (App Router)  
**Ngôn ngữ:** TypeScript  
**UI Style:** Glassmorphism với Framer Motion animations

---

## 🏗️ CẤU TRÚC DỰ ÁN

```
8w6s_profile/
├── app/                      # Next.js App Router
│   ├── admin/               # Trang admin panel
│   ├── api/                 # API routes
│   │   ├── auth/           # Authentication endpoints
│   │   ├── like/           # Like functionality
│   │   ├── profile/        # Profile data
│   │   ├── setup/          # Setup wizard
│   │   └── views/          # View tracking
│   ├── context/            # React Context (ProfileContext)
│   ├── setup/              # Setup wizard page
│   └── page.tsx            # Homepage
│
├── components/              # React Components
│   ├── EnterScreen.tsx     # Landing/enter screen
│   ├── IconPicker.tsx      # Icon selection component
│   ├── MusicPlayer.tsx     # Spotify/music player
│   ├── TypewriterBio.tsx   # Animated bio text
│   └── WakaTimeStats.tsx   # WakaTime coding stats
│
├── hooks/                   # Custom React Hooks
│   └── useLanyard.ts       # Discord Lanyard integration
│
├── utils/                   # Utility functions
│   └── config.ts           # Configuration management
│
├── public/                  # Static assets
│
└── backup/                  # ⚠️ BACKUP FOLDER - DO NOT TOUCH
```

---

## 🛠️ CÔNG NGHỆ SỬ DỤNG

### Core Stack
- **Next.js 15+** - React framework với App Router
- **TypeScript** - Type-safe JavaScript
- **React 19** - UI library
- **Tailwind CSS** - Utility-first CSS framework

### UI & Animation
- **Framer Motion** - Animation library
- **Glassmorphism** - UI design style (frosted glass effect)
- **Lucide React** - Icon library

### Integrations
- **Discord Lanyard** - Real-time Discord presence
- **WakaTime API** - Coding statistics
- **Spotify** - Music player integration

### Features
- ✅ Admin panel với authentication
- ✅ Profile customization (bio, links, socials)
- ✅ Music player với Spotify integration
- ✅ View counter & like system
- ✅ WakaTime coding stats
- ✅ Discord presence (Lanyard)
- ✅ Setup wizard cho first-time setup
- ✅ Responsive design
- ✅ Dark mode với glassmorphism

---

## 🚀 CÁCH CHẠY DỰ ÁN

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Cấu hình environment variables
Tạo file `.env.local` với các biến:
```env
# Discord Lanyard
NEXT_PUBLIC_DISCORD_ID=your_discord_id

# WakaTime
WAKATIME_API_KEY=your_wakatime_key

# Admin
ADMIN_PASSWORD=your_admin_password
```

### 3. Chạy development server
```bash
npm run dev
```

Mở http://localhost:3000

### 4. Build production
```bash
npm run build
npm start
```

---

## 📁 CÁC FILE QUAN TRỌNG

### Configuration
- `next.config.ts` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS config
- `tsconfig.json` - TypeScript config
- `package.json` - Dependencies & scripts

### Documentation
- `README.md` - Project overview
- `TODO.md` - Task list
- `FEATURE_IDEAS_CHECKLIST.md` - Feature ideas
- `CLAUDE.md` - AI assistant instructions

### Data Storage
- Profile data được lưu trong localStorage (client-side)
- Admin settings trong localStorage
- View count & likes có thể dùng API routes

---

## 🔄 KHÔI PHỤC TỪ BACKUP

Nếu cần khôi phục dự án từ backup:

### Option 1: Khôi phục toàn bộ
```bash
# Xóa các file hiện tại (trừ backup)
rm -rf app components hooks utils public *.json *.ts *.js *.md

# Copy từ backup
cp -r backup/* ./
```

### Option 2: Khôi phục từng phần
```bash
# Ví dụ: chỉ khôi phục components
cp -r backup/components ./
```

### Option 3: So sánh thay đổi
```bash
# Xem diff giữa file hiện tại và backup
diff -u backup/app/page.tsx app/page.tsx
```

---

## 🎨 DESIGN SYSTEM

### Colors
- Primary: Glassmorphism với backdrop-blur
- Background: Dark gradient
- Accent: Purple/Blue tones
- Text: White với opacity variations

### Typography
- Font: System fonts (Inter, SF Pro)
- Sizes: Tailwind default scale

### Components Style
- Rounded corners: `rounded-2xl`, `rounded-3xl`
- Glass effect: `backdrop-blur-xl bg-white/10`
- Shadows: `shadow-2xl`, `shadow-[color]`
- Borders: `border border-white/20`

---

## 📝 GHI CHÚ PHÁT TRIỂN

### Recent Changes (từ git history)
1. **18a34c4** - Fix i18n translations (fully strict)
2. **39bc114** - Translate Vietnamese to English in admin
3. **2e1522a** - Fix admin presets & form reset (v1.0.0.patch1)
4. **41cdae6** - Complete refactor: glassmorphism UI + Framer Motion
5. **48cc173** - Update preview image

### Known Issues
- Check `TODO.md` cho danh sách tasks
- Admin authentication cần được strengthen
- Music player có thể cần Spotify API credentials

### Development Tips
- Dùng `npm run dev` cho hot reload
- TypeScript strict mode enabled
- ESLint configured
- Git hooks có thể được setup

---

## 🔐 BẢO MẬT

### Sensitive Data
- **KHÔNG** commit `.env.local`
- **KHÔNG** commit API keys
- **KHÔNG** commit passwords
- Admin password nên dùng environment variable

### Git Ignore
File `.gitignore` đã được cấu hình để ignore:
- `node_modules/`
- `.next/`
- `.env*.local`
- Build outputs

---

## 📞 LIÊN HỆ & HỖ TRỢ

Nếu cần hỗ trợ hoặc có câu hỏi:
1. Đọc lại file này
2. Check `README.md` cho thông tin cơ bản
3. Check `TODO.md` cho tasks đang làm
4. Check git history: `git log --oneline`
5. Check backup folder nếu cần reference code gốc

---

## ⏰ THÔNG TIN BACKUP

**Ngày tạo backup:** 2026-04-18  
**Branch:** main  
**Last commit:** 18a34c4 (fix(i18n): ensure all translations are fully strictly applied)  
**Node version:** Kiểm tra với `node --version`  
**NPM version:** Kiểm tra với `npm --version`

---

## 🎯 NEXT STEPS

Khi bắt đầu làm việc với dự án:
1. ✅ Đọc file này để hiểu tổng quan
2. ✅ Check `README.md` cho setup instructions
3. ✅ Cài đặt dependencies: `npm install`
4. ✅ Tạo `.env.local` với credentials cần thiết
5. ✅ Chạy dev server: `npm run dev`
6. ✅ Check `TODO.md` cho tasks cần làm
7. ✅ **NHỚ: KHÔNG BAO GIỜ ĐỤNG VÀO FOLDER `backup/`**

---

**🔒 LƯU Ý CUỐI CÙNG:**  
Folder `backup/` là bản sao lưu duy nhất của dự án gốc.  
Hãy coi nó như một "time capsule" - chỉ đọc, không sửa.  
Nếu mọi thứ hỏng, bạn luôn có thể quay lại đây.
