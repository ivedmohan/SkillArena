import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import FirebaseAuthProvider from "../components/FirebaseAuthProvider";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "SkillArena — Gamify Learning",
  description: "Competitive quiz battle engine for aptitude, coding, and domain skills.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} antialiased min-h-screen bg-[#0f0f1a] flex flex-col`}>
        <FirebaseAuthProvider>
          <Navbar />
          <div className="flex-1 flex flex-col">
            {children}
          </div>
        </FirebaseAuthProvider>
      </body>
    </html>
  );
}
