"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

export default function Navbar() {
  const pathname = usePathname();

  // Hide the navbar during active gameplay to avoid distractions
  if (pathname?.startsWith("/game/")) {
    return null;
  }

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Leaderboards", path: "/leaderboards" },
    { name: "Admin", path: "/admin" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#0f0f1a]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center gap-2 group">
            <span className="text-2xl">⚡</span>
            <span className="font-black text-xl tracking-tight transition-transform group-hover:scale-105">
              <span className="text-[#00ff88] drop-shadow-[0_0_10px_rgba(0,255,136,0.3)]">Skill</span>
              <span className="text-white">Arena</span>
            </span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-8">
              {navLinks.map((link) => {
                const isActive = pathname === link.path;
                return (
                  <Link
                    key={link.name}
                    href={link.path}
                    className="relative py-2 text-sm font-bold uppercase tracking-widest transition-colors"
                  >
                    <span className={isActive ? "text-white" : "text-[#8888aa] hover:text-[#d0d0e0]"}>
                      {link.name}
                    </span>
                    {isActive && (
                      <motion.div
                        layoutId="navbar-indicator"
                        className="absolute -bottom-[21px] left-0 right-0 h-0.5 bg-[#00ff88] shadow-[0_0_8px_#00ff88]"
                        initial={false}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* CTA / Version */}
          <div className="hidden md:flex items-center">
            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-[#8888aa] font-mono shadow-inner">
              v1.0.0-beta
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}
