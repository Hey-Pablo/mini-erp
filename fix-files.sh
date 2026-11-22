#!/bin/bash
cat > package.json << 'PACKAGE'
{
  "name": "mini-erp",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint . --ext .ts,.tsx --max-warnings 0",
    "format": "prettier --write ."
  },
  "dependencies": {
    "@hookform/resolvers": "^3.5.0",
    "@tanstack/react-query": "^5.56.0",
    "clsx": "^2.1.1",
    "lucide-react": "^0.445.0",
    "pdf-lib": "^1.17.1",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.53.0",
    "react-router-dom": "^6.26.2",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@testing-library/dom": "^10.4.2",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.3.3",
    "@testing-library/user-event": "^14.6.13",
    "@types/react": "^18.3.6",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^5.0.0",
    "autoprefixer": "^10.4.20",
    "eslint": "^9.16.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-react": "^7.35.0",
    "happy-dom": "^21.0.4",
    "prettier": "^3.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.7.3",
    "vite": "^5.5.3",
    "vitest": "^2.0.0"
  }
}
PACKAGE

cat > vitest.config.ts << 'VITEST'
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'happy-dom',
    setupFiles: ['./src/vitest.setup.ts'],
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['src/**/*.d.ts', 'src/**/*.test.{ts,tsx}'],
    },
  },
});
VITEST

cat > src/index.css << 'CSS'
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

@layer components {
  .btn {
    @apply inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none;
  }
  .btn-primary {
    @apply btn bg-blue-600 text-white hover:bg-blue-700;
  }
  .btn-secondary {
    @apply btn bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-300;
  }
  .btn-danger {
    @apply btn bg-red-600 text-white hover:bg-red-700;
  }
  .btn-ghost {
    @apply btn bg-transparent hover:bg-gray-100;
  }
  .input {
    @apply flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50;
  }
  .label {
    @apply block text-sm font-medium text-gray-700 mb-1;
  }
  .card {
    @apply rounded-lg border border-gray-200 bg-white shadow-sm;
  }
  .table-container {
    @apply overflow-x-auto;
  }
  .table {
    @apply w-full caption-bottom text-sm;
  }
  .table-header {
    @apply [&_tr]:border-b;
  }
  .table-body {
    @apply [&_tr:last-child]:border-0;
  }
  .table-row {
    @apply border-b border-gray-200 transition-colors hover:bg-gray-50 data-[state=selected]:bg-gray-100;
  }
  .table-head {
    @apply h-12 px-4 text-left align-middle font-medium text-gray-500 [&:has([role=checkbox])]:pr-0;
  }
  .table-cell {
    @apply p-4 align-middle [&:has([role=checkbox])]:pr-0;
  }
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f5f9;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
CSS

cat > src/main.tsx << 'MAIN'
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
MAIN

chmod +x fix-files.sh
./fix-files.sh
