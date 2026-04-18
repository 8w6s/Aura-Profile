# Aura Profile (1.0)
A highly customizable, beautiful, and responsive personal biolink & portfolio page built with Next.js, Tailwind CSS, & Framer Motion. 
Features a complete in-browser Admin CMS and database storage powered by Supabase.
![Preview](https://files.catbox.moe/tczkrb.png)
## ?? Super Simple Setup
### Prerequisites
- Node.js 18+ installed on your PC
- A free account on [Supabase](https://supabase.com/)
### 1. Database Setup
1. Create a new project on **Supabase**.
2. Open your project's **SQL Editor**.
3. Copy and run this command to create the required table:
```sql
CREATE TABLE public.profile_data (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
NOTIFY pgrst, 'reload schema';
```
### 2. Website Setup
1. Clone or download this repository.
2. Open the folder in Terminal and run:
```bash
npm install
```
3. Create a `.env` file in the root folder with your Supabase credentials (found in Supabase -> Project Settings -> API):
```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```
### 3. Run It!
Start your local server:
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser!
If you want to edit your profile visually, simply go to **[http://localhost:3000/admin](http://localhost:3000/admin)**.
---
*Built with ?? by 8w6s.*

