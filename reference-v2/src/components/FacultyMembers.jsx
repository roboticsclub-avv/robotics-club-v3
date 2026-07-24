'use client';
import Image from 'next/image';
import styles from './FacultyMembers.module.css';

export default function FacultyMembers() {
  return (
    <section id="faculty-members" className={styles.container}>
      <h2 className={styles.sectionTitle}>FACULTY MEMBERS</h2>
      
      <div className={styles.cardContent}>
        {/* Left Photo Section */}
        <div className={styles.cardLeft}>
          <Image
            src="/media/DR. RAVISHANKAR P DESAI.jpeg"
            alt="Dr. Ravishankar P Desai"
            width={500}
            height={600}
            quality={95}
            priority
            className={styles.photo}
          />
        </div>

        {/* Right Info Section */}
        <div className={styles.cardRight}>
          <div className={styles.watermark}>R</div>
          
          <h3 className={styles.name}>DR. RAVISHANKAR P DESAI</h3>
          <p className={styles.role}>FACULTY MENTOR</p>

          <blockquote className={styles.quote}>
            "Guiding the next generation of innovators."
          </blockquote>

          <h4 className={styles.subsectionTitle}>BIO</h4>
          <p className={styles.desc}>
            Dr. Desai is a distinguished professor with over 15 years of experience in robotics research. He provides invaluable guidance and mentorship to the club members.
          </p>

          <h4 className={styles.subsectionTitle}>RESEARCH INTERESTS</h4>
          <div className={styles.tags}>
            <span className={styles.tag}>Control Systems</span>
            <span className={styles.tag}>AI/ML & RL for Autonomous Robot</span>
            <span className={styles.tag}>Control of Autonomous (Marine</span>
            <span className={styles.tag}>Aerial and Ground) Vehicles</span>
            <span className={styles.tag}>Process and Biomedical Instrumentation</span>
            <span className={styles.tag}>Underwater and Medical Image Processing</span>
          </div>
        </div>
      </div>
    </section>
  );
}
