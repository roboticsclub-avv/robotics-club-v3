"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Navbar.module.css";
import { LiquidGlassCard } from "./ui/liquid-glass";
import ThemeSwitcher from "./ui/ThemeSwitcher";
import useAuth from "@/hooks/useAuth";
import UserProfileModal from "@/components/profile/UserProfileModal";

const NAV_ITEMS = [
  { label: "About", href: "/#about" },
  { label: "Team", href: "/#team" },
  { label: "Events", href: "/#events" },
  { label: "Requisition", href: "/#requisition" },
  { label: "Projects", href: "/#projects" },
  { label: "Contact", href: "/#contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
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
                <div className="flex items-center gap-2.5">
                  {/* Portal Shortcut Button */}
                  {isAdmin || ["admin", "technical", "ops", "data", "media", "secretary", "it"].includes(profile?.role) ? (
                    <Link href="/dashboard" className={styles.btnSecondary}>
                      <span>🔑</span> Admin Portal
                    </Link>
                  ) : (
                    <Link href="/member" className={styles.btnSecondary}>
                      Member Portal
                    </Link>
                  )}

                  {/* Rightmost Profile Button (Integrated Admin Tag & Logout Modal Trigger) */}
                  <button
                    onClick={() => setShowProfileModal(true)}
                    className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 text-white transition-all hover:scale-105 shadow-sm group"
                    title="View Profile, Settings, Logout & Hardware Status"
                  >
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold text-[10px] shrink-0">
                      {profile?.photoURL ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={profile.photoURL} alt={profile.name || "User"} className="w-full h-full object-cover" />
                      ) : (
                        <span>{profile?.name ? profile.name[0].toUpperCase() : "👤"}</span>
                      )}
                    </div>

                    <span className="text-xs font-mono font-bold hidden md:inline truncate max-w-[90px]">
                      {profile?.name?.split(" ")[0] || "Profile"}
                    </span>

                    {/* Integrated Role Tag (ADMIN / MEMBER inside Profile Button) */}
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                      {profile?.role || (isAdmin ? "ADMIN" : "MEMBER")}
                    </span>
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
            {/* Rightmost Profile Trigger Button with integrated Role Tag */}
            <button
              onClick={() => {
                setMobileOpen(false);
                setShowProfileModal(true);
              }}
              className="w-full py-2.5 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-semibold text-xs tracking-wide transition-all flex items-center justify-center gap-2"
            >
              <div className="w-5 h-5 rounded-full overflow-hidden bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-[9px]">
                {profile?.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.photoURL} alt={profile.name || "User"} className="w-full h-full object-cover" />
                ) : (
                  <span>👤</span>
                )}
              </div>
              <span className="font-bold text-white">{profile?.name?.split(" ")[0] || "Profile"}</span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                {profile?.role || (isAdmin ? "ADMIN" : "MEMBER")}
              </span>
            </button>

            {isAdmin || ["admin", "technical", "ops", "data", "media", "secretary", "it"].includes(profile?.role) ? (
              <Link
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="w-full py-2.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white font-semibold text-xs tracking-wide transition-all"
              >
                🔑 Admin Portal
              </Link>
            ) : (
              <Link
                href="/member"
                onClick={() => setMobileOpen(false)}
                className="w-full py-2.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white font-semibold text-xs tracking-wide transition-all"
              >
                Member Portal
              </Link>
            )}
          </div>
        )}
      </div>

      {/* User Quick View Profile Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </>
  );
}
