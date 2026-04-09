'use client';

import React, { ReactNode } from 'react';
import '../styles/globals.css';

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Synthetic Research Lab</title>
        <meta name="description" content="Generate synthetic survey responses using AI" />
      </head>
      <body>
        <div className="min-h-screen flex flex-col">
          <header className="bg-white shadow">
            <nav className="container h-16 flex items-center justify-between">
              <div className="text-2xl font-bold text-blue-600">SRL</div>
              <div className="flex gap-4">
                {/* Navigation links will be added */}
              </div>
            </nav>
          </header>
          <main className="flex-1">
            {children}
          </main>
          <footer className="bg-gray-50 border-t border-gray-200">
            <div className="container py-8 text-sm text-gray-600">
              <p>© 2024 Synthetic Research Lab. All rights reserved.</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
