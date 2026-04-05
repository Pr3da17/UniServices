# UniServices Dashboard

> **⚠️ COPYRIGHT NOTICE / PORTFOLIO RESTRICTION ⚠️**
> This repository is strictly provided as a **portfolio showcase**. 
> It is **NOT open-source**. All rights reserved. 
> You may view the code to evaluate my work, but you are absolutely strictly prohibited from copying, distributing, modifying, or using this code (in part or in whole) for any personal, commercial, or academic purposes.

A modern, ultra-fast alternative to Moodle designed for students. Built with React, TypeScript, Vite, and Tailwind CSS.
## Features

- **Retractable Sidebar**: Clean navigation with smooth animations
- **Dark Mode by Default**: Modern UI inspired by Notion and Linear
- **Urgences Section**: Priority-based assignment tracking with submit buttons
- **Documents Section**: Quick download access to latest course materials
- **Responsive Design**: Mobile-first approach with glassmorphism effects
- **Mock Data**: Ready for integration with real Moodle data

## Tech Stack

- **Frontend**: React 19.2 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4 with dark mode
- **Icons**: Lucide React
- **Development**: ESLint, Hot Module Replacement

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start development server:

   ```bash
   npm run dev
   ```

3. Open [http://localhost:5173](http://localhost:5173) in your browser

## Build for Production

```bash
npm run build
```

## Project Structure

```
src/
├── components/
│   └── Sidebar.tsx
├── App.tsx
├── main.tsx
└── index.css
```

## Future Integration

This MVP is designed to integrate with Moodle APIs for:

- Real-time assignment data
- Course document downloads
- User authentication
- Calendar synchronization

