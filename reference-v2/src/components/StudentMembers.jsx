'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import styles from './StudentMembers.module.css';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const teamData = [
  {
    id: 'shashwat',
    name: 'SHASHWAT MISHRA',
    role: 'PRESIDENT',
    quote: '"Innovation distinguishes between a leader and a follower."',
    bio: 'Shashwat is a visionary leader with a passion for robotics and AI. He has led multiple successful projects and is dedicated to fostering a culture of innovation within the club.',
    interests: ['Autonomous Navigation', 'Defence Robotics', 'Artificial Intelligence in Robotics'],
    image: '/media/SHASHWAT MISHRA.png',
  },
  {
    id: 'nishanth',
    name: 'AREKATLA NISHANTH',
    role: 'VICE PRESIDENT',
    quote: '"Execution is everything."',
    bio: 'Nishanth is known for his execution skills and operational excellence. He ensures that all club activities run smoothly and efficiently.',
    interests: ['Mechanical Design', 'Kinematics', 'Rapid Prototyping'],
    image: '/media/AREKATLA NISHANTH.png',
  },
  {
    id: 'likith',
    name: 'LIKITH SAI SUNKAVALLI',
    role: 'TECH LEAD',
    quote: '"Empowering others to achieve their best."',
    bio: 'Likith is an experienced member who loves building and innovating applications. He specializes in embedded systems and Software Design.',
    interests: ['Embedded Systems', 'IoT', 'Signal Processing'],
    image: '/media/LIKITH SAI SUNKAVALLI.png',
  },
  {
    id: 'rithvik',
    name: 'C RITHVIK BHASKAR',
    role: 'STUDENT MENTOR',
    quote: '"Sharing knowledge is the key to growth."',
    bio: 'AI-focused technologist passionate about impactful innovation. Combines leadership with strong execution to deliver real-world solutions. Driven to inspire teams and shape a smarter future.',
    interests: ['Artificial Intelligence', 'Product-Focused ML', 'Real-World Deployment', 'Innovation'],
    image: '/media/C RITHVIK BHASKAR.png',
  },
  {
    id: 'thaslim',
    name: 'SHAIK THASLIM',
    role: 'TREASURER',
    quote: '"Managing resources for maximum impact."',
    bio: 'Shaik Thaslim, an Artificial Intelligence student with experience in analytical thinking and problem-solving. As Treasurer, she ensures efficient management of resources while supporting technically driven initiatives.',
    interests: ['Applied AI', 'Intelligent Systems', 'Data-Driven Problem Solving'],
    image: '/media/SHAIK THASLIM.png',
  },
  {
    id: 'saranya',
    name: 'NALLURI SARANYA',
    role: 'GENERAL SECRETARY',
    quote: '"Building impactful tech solutions and pushing technical limits."',
    bio: "I'm Nalluri Saranya, a Computer Science student passionate about building impactful tech solutions. I work on full-stack development, AI-powered platforms, and competitive programming projects.",
    interests: ['Full-stack Development', 'AI Platforms', 'Competitive Programming'],
    image: '/media/NALLURI SARANYA.png',
  },
];

const bgTilePath = `${basePath}/media/tile.background.PNG`;

export default function StudentMembers() {
  const [selectedMember, setSelectedMember] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  /* Lock scroll when modal is open */
  useEffect(() => {
    if (selectedMember) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedMember]);

  /* Escape key closes modal */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setSelectedMember(null);
    };
    if (selectedMember) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedMember]);

  return (
    <>
      <section className={styles.container} id="student-members">
        <h2 className={styles.sectionTitle}>STUDENT MEMBERS</h2>

        <div className={styles.grid}>
          {teamData.map((member) => (
            <div
              key={member.id}
              className={styles.devLifeCard}
              onClick={() => setSelectedMember(member)}
            >
              <div className={styles.cardInner}>
                {/* 1. Revealed Text + View Button */}
                <div className={styles.cardText}>
                  <h2 className={styles.cyberGlowText}>{member.name}</h2>
                  <h2 className={styles.purpleText}>{member.role}</h2>
                  <p>{member.quote}</p>

                  <button
                    className={styles.viewBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMember(member);
                    }}
                  >
                    <span>VIEW PROFILE</span>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M5 12H19M19 12L13 6M19 12L13 18"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>

                {/* 2. Clean Background Image */}
                <div className={styles.cardBg}>
                  <img
                    src={bgTilePath}
                    alt="Club Background"
                    className={styles.cardBgImage}
                  />
                  <div className={styles.darkOverlay}></div>
                </div>

                {/* 3. Pop-Out Cutout */}
                <img
                  src={`${basePath}${member.image}`}
                  alt={`${member.name} Cutout`}
                  className={styles.cardCutout}
                />
              </div>

              {/* Static Domain Title below card */}
              <h3 className={styles.domainTitle}>{member.role}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* Profile Modal */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {selectedMember && (
              <motion.div
                className={styles.modalOverlay}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onClick={() => setSelectedMember(null)}
              >
                <motion.div
                  className={styles.modalContent}
                  initial={{ scale: 0.92, y: 30, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.92, y: 30, opacity: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Left Side: Photo */}
                  <div className={styles.modalLeft}>
                    <img
                      src={`${basePath}${selectedMember.image}`}
                      alt={selectedMember.name}
                    />
                  </div>

                  {/* Right Side: Info */}
                  <div className={styles.modalRight}>
                    <button
                      className={styles.closeBtn}
                      onClick={() => setSelectedMember(null)}
                      aria-label="Close modal"
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>

                    <h2 className={styles.modalName}>{selectedMember.name}</h2>
                    <h3 className={styles.modalRole}>{selectedMember.role}</h3>

                    <div className={styles.modalQuote}>{selectedMember.quote}</div>

                    <h4 className={styles.modalSectionTitle}>BIO</h4>
                    <p className={styles.modalDesc}>{selectedMember.bio}</p>

                    <h4 className={styles.modalSectionTitle}>RESEARCH INTERESTS</h4>
                    <div className={styles.modalTags}>
                      {selectedMember.interests.map((interest, idx) => (
                        <span key={idx} className={styles.tag}>
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
