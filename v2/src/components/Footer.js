import Image from "next/image";
import styles from "./Footer.module.css";

export default function Footer() {
    return (
        <footer className={styles.footer} id="contact">
            <div className="container">
                <div className={styles.footerGrid}>
                    <div className={styles.footerBrand}>
                        <div className={styles.footerLogo}>
                            <Image src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/media/logo.png`} alt="Robotics Club Logo" width={32} height={32} className={styles.footerLogoIcon} />
                            Robotics Club
                        </div>
                        <p className={styles.footerDescription}>
                            Building the future of robotics, one project at a time. Open
                            to all years and all majors.
                        </p>
                        <div className={styles.socialLinks}>
                            <a href="#" className={styles.socialIcon} aria-label="Twitter">
                                𝕏
                            </a>
                            <a href="#" className={styles.socialIcon} aria-label="LinkedIn">
                                in
                            </a>
                            <a href="#" className={styles.socialIcon} aria-label="Instagram">
                                IG
                            </a>
                        </div>
                    </div>

                    <div className={styles.footerColumn}>
                        <div className={styles.footerColumnTitle}>Resources</div>
                        <a href="#" className={styles.footerLink}>Documentation</a>
                        <a href="#" className={styles.footerLink}>Tutorials</a>
                        <a href="#" className={styles.footerLink}>Blog</a>
                        <a href="#" className={styles.footerLink}>FAQ</a>
                    </div>

                    <div className={styles.footerColumn}>
                        <div className={styles.footerColumnTitle}>Contact</div>
                        <a href="mailto:roboticsclub@av.amrita.edu" className={styles.footerLink}>
                            roboticsclub@av.amrita.edu
                        </a>
                        <a href="#" className={styles.footerLink}>Discord Server</a>
                        <a href="#" className={styles.footerLink}>Room 609, A block</a>
                    </div>
                </div>

                <div className={styles.footerBottom}>
                    <div className={styles.copyright}>
                        &copy; {new Date().getFullYear()} Robotics Club. All rights reserved.
                    </div>
                    <div className={styles.footerBottomLinks}>
                        <a href="#" className={styles.footerBottomLink}>Privacy Policy</a>
                        <a href="#" className={styles.footerBottomLink}>Terms of Use</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
