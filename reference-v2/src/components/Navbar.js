"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Navbar.module.css";

const NAV_ITEMS = [
    { label: "About", href: "/#about" },
    { label: "Team", href: "/#team" },
    { label: "Events", href: "/#events" },
    { label: "Projects", href: "/#projects" },
    { label: "Contact", href: "/#contact" },
];

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const pathname = usePathname();

    const handleNavClick = (e, href) => {
        // If it's a hash link and we're currently on the home page
        if (href.startsWith('/#') && pathname === '/') {
            e.preventDefault();
            const targetId = href.replace('/#', '');
            const elem = document.getElementById(targetId);
            if (elem) {
                elem.scrollIntoView({ behavior: 'smooth' });
                // Optional: update URL hash manually
                if (window.history.pushState) {
                    window.history.pushState(null, null, href.replace('/', ''));
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
                <div className={styles.navContainer}>
                    <Link href="/" className={styles.logo}>
                        <div className={styles.logoIcon}>
                            <Image
                                src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/media/logo.png`}
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
                        <Link href="/login" className={styles.btnSecondary}>
                            Login
                        </Link>
                        <Link href="/join-us" className={styles.btnPrimary}>
                            Join Us
                        </Link>
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
            </div>
        </>
    );
}
