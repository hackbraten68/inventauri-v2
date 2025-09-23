import "./globals.css";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";

import AuthProvider from "@/components/auth-provider";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata = {
  title: "Inventauri",
  description: "Inventory & Sales MVP",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <main className="flex-1">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
