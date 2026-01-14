import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { NotesProvider } from "@/context/NotesContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Corporate Obsidian",
  description: "Enterprise Knowledge Graph",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 flex h-screen overflow-hidden`}>
        <NotesProvider>
          <Sidebar />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </NotesProvider>
      </body>
    </html>
  );
}
