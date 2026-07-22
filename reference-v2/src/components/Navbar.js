"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Navbar.module.css";
import { LiquidGlassCard } from "./ui/liquid-glass";
import ThemeSwitcher from "./ui/ThemeSwitcher";
import useAuth from "@/hooks/useAuth";

const NAV_ITEMS = [
  { label: "About", href: "/#about" },
  { label: "Team", href: "/#team" },
  { label: "Events", href: "/#events" },
  { label: "Projects", href: "/#projects" },
  { label: "Requisition", href: "/requisition" },
  { label: "Contact", href: "/#contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { user, profile, isAuthenticated, isAdmin, logout } = useAuth();

  const handleNavClick = (e, href) => {
    // If it's a hash link and we're currently on the home page
    if (href.startsWith("/#") && pathname === "/") {
      e.preventDefault();
      const targetId = href.replace("/#", "");
      const elem = document.getElementById(targetId);
      if (elem) {
        if (window.lenis) {
          window.lenis.scrollTo(elem);
        } else {
          elem.scrollIntoView({ behavior: "smooth" });
        }
        if (window.history.pushState) {
          window.history.pushState(null, null, href.replace("/", ""));
        }
      }
    }
    setMobileOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ""}`}>
        <LiquidGlassCard
          className={styles.navbarBacking}
          blurIntensity="xl"
          borderRadius="20px"
          glowIntensity={scrolled ? "md" : "sm"}
          shadowIntensity="md"
          draggable={false}
        >
          <div className={styles.navContainer}>
            <Link href="/" className={styles.logo}>
              <div className={styles.logoIcon}>
                <Image
                  src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/media/logo.png`}
                  alt="Robotics Club Logo"
                  width={32}
                  height={32}
                  style={{ objectFit: "contain" }}
                />
              </div>
              Robotics Club
            </Link>

            <div className={styles.navLinks}>
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={styles.navLink}
                  onClick={(e) => handleNavClick(e, item.href)}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className={styles.navActions}>
              <ThemeSwitcher />

              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  {/* User Role Tag / Badge */}
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-white/[0.04] text-purple-300 border border-purple-500/20 backdrop-blur-sm">
                    {profile?.role || (isAdmin ? "ADMIN" : "MEMBER")}
                  </span>

                  {/* Portal Shortcut Button */}
                  {isAdmin || ["admin", "technical", "ops", "data", "media", "secretary", "it"].includes(profile?.role) ? (
                    <Link
                      href="/dashboard"
                      className={styles.btnSecondary}
                      style={{
                        borderColor: "rgba(168, 85, 247, 0.3)",
                        background: "rgba(168, 85, 247, 0.12)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <span>🔑</span> Admin Portal
                    </Link>
                  ) : (
                    <Link href="/member" className={styles.btnSecondary}>
                      Member Portal
                    </Link>
                  )}

                  {/* Logout Button */}
                  <button
                    onClick={logout}
                    className="text-xs text-gray-400 hover:text-red-400 transition px-2 py-1"
                    title="Sign Out"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <>
                  <Link href="/login" className={styles.btnSecondary}>
                    Login
                  </Link>
                  <Link href="/join-us" className={styles.btnPrimary}>
                    Join Us
                  </Link>
                </>
              )}
            </div>

            <button
              className={styles.hamburger}
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <span className={styles.hamburgerLine} />
              <span className={styles.hamburgerLine} />
              <span className={styles.hamburgerLine} />
            </button>
          </div>
        </LiquidGlassCard>
      </nav>

      {/* Mobile menu overlay */}
      <div className={`${styles.mobileMenu} ${mobileOpen ? styles.open : ""}`}>
        <button
          className={styles.closeBtn}
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          ✕
        </button>

        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={styles.mobileLink}
            onClick={(e) => handleNavClick(e, item.href)}
          >
            {item.label}
          </Link>
        ))}

        {isAuthenticated && (
          <div className="flex flex-col items-center gap-3 pt-4 border-t border-white/10 w-full max-w-xs text-center">
            <span className="px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-white/[0.04] text-purple-300 border border-purple-500/20">
              Role: {profile?.role || (isAdmin ? "ADMIN" : "MEMBER")}
            </span>

            {isAdmin || ["admin", "technical", "ops", "data", "media", "secretary", "it"].includes(profile?.role) ? (
              <Link
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="w-full py-2.5 rounded-full bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-white font-semibold text-xs tracking-wide transition-all"
              >
                🔑 Admin Portal
              </Link>
            ) : (
              <Link
                href="/member"
                onClick={() => setMobileOpen(false)}
                className="w-full py-2.5 rounded-full bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-white font-semibold text-xs tracking-wide transition-all"
              >
                Member Portal
              </Link>
            )}

            <button
              onClick={() => {
                setMobileOpen(false);
                logout();
              }}
              className="text-xs text-red-400 font-mono py-1"
            >
              Logout ({profile?.name || user?.email?.split("@")[0]})
            </button>
          </div>
        )}
      </div>
    </>
  );
}
