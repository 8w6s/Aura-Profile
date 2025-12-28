# Aura Profile (Beta 0.1)

> A highly customizable, beautiful, and responsive personal profile/biolink page built with Next.js, Tailwind CSS, and Framer Motion. Inspired by premium bio services.

![Preview Placeholder](https://via.placeholder.com/1200x600?text=Aura+Profile+Preview)

## ✨ Features

*   **Modern UI/UX**: Glassmorphism design, smooth animations (Framer Motion), and fully responsive layout for Mobile & PC.
*   **Highly Customizable**:
    *   **Themes**: Change primary colors, background images, blur effects, and fonts.
    *   **Effects**: Typewriter bio, text glows, glitches, and custom cursors.
    *   **Layout**: Toggle visibility of sections (Likes, Views, Comments, etc.).
*   **Rich Integrations**:
    *   **Discord Presence (Lanyard)**: Real-time status, Spotify listening, and game activity.
    *   **Hoyoverse**: Display Genshin Impact, HSR, HI3, ZZZ stats.
    *   **Steam**: Show online status and recent games.
    *   **WakaTime**: Display coding statistics.
    *   **LeetCode**: Show coding problem stats.
*   **File Management**:
    *   **Dual Upload System**: Choose between cloud hosting (**Catbox.moe**) or local storage (`/public/assets`) for your files.
    *   **Source Indicators**: Clearly see if a file is from "Local Asset" or "Catbox.moe".
    *   **Library**: Manage, delete, and organize all uploaded files.
*   **Content Management**:
    *   **Blog/Posts**: Create posts with **Markdown support**, image support, and **multi-file attachments** (with popup selection).
    *   **Projects**: Showcase your portfolio with tags, **multiple direct links**, and visibility toggles.
    *   **Skills**: Visual progress sliders with skill types (Frontend, Backend, etc.).
    *   **Music Player**: Global music player with playlist support.
*   **Admin Panel**: A comprehensive dashboard to manage all your data without touching code.

## 🚀 Getting Started

### Prerequisites

*   Node.js 18+
*   npm or yarn

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/aura-profile.git
    cd aura-profile
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view your profile.
    Open [http://localhost:3000/admin](http://localhost:3000/admin) to manage content.

### Building for Production

```bash
npm run build
npm start
```

## 🛠 Configuration

### Admin Panel
Access `/admin` to configure:
*   **Profile**: Name, bio, avatar, banner, skills (sliders).
*   **Library**: Upload files to Catbox.moe or Local Storage.
*   **Integrations**: Enable/Disable Discord, Spotify, etc.
*   **Catbox**: Enter your User Hash to enable file uploads.

### File Upload Modes
1.  **Catbox.moe (Cloud)**:
    *   Requires **User Hash** (Get it from [Catbox.moe](https://catbox.moe/user/manage.php)).
    *   Files are hosted externally.
    *   Supports tracking and deletion if User Hash is provided.
2.  **Local Assets**:
    *   Files are saved to your project's `/public/assets` folder.
    *   Best for permanent site assets (backgrounds, favicons).
    *   No external account required.

## 🎨 Customization Tips
*   **Backgrounds**: Use high-quality dark wallpapers for the best glassmorphism effect.
*   **Markdown**: Use Markdown in your post content for rich text formatting.
*   **Skills**: Group your skills by type (Frontend, Backend) for a colorful progress bar display.

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## 📜 License

This project is licensed under a **Custom Non-Commercial License**.

*   ✅ **Allowed**: You can freely use, modify, customize, and share this project.
*   ❌ **Prohibited**: You are **strictly prohibited** from selling this project or any derivative works for money. This project is free and must remain free.

See the [LICENSE](LICENSE) file for details.

---
*Created by 8w6s*
