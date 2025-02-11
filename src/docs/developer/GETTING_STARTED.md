
# Getting Started

## Prerequisites
- Node.js v18+
- pnpm (recommended) or npm
- Git
- Supabase account

## Project Setup

### 1. Clone and Install
```bash
git clone [repository-url]
cd [project-name]
pnpm install
```

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Supabase Configuration
1. Create a new Supabase project
2. Copy the project URL and anon key from Project Settings -> API
3. Update your `.env` file with these values

### 4. Development Server
```bash
pnpm dev
```
Access the application at `http://localhost:8080`

## Tech Stack Overview

### Frontend
- **Vite**: Build tool and development server
- **React**: UI library
- **TypeScript**: Type safety and developer experience
- **Shadcn/ui**: UI component library
- **Tailwind CSS**: Utility-first CSS framework

### Backend
- **Supabase**: Backend-as-a-Service
  - Authentication
  - PostgreSQL Database
  - Real-time subscriptions
  - Edge Functions
  - Storage

## Available Scripts
- `pnpm dev`: Start development server
- `pnpm build`: Build for production
- `pnpm preview`: Preview production build
- `pnpm lint`: Run ESLint
- `pnpm type-check`: Run TypeScript checks

