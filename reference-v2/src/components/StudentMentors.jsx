'use client';
import Image from 'next/image';
import styles from './StudentMentors.module.css';

export default function StudentMentors() {
  const mentors = [
    {
      name: 'C RITHVIK BHASKAR',
      role: 'STUDENT MENTOR',
      image: '/media/Rithvik.jpeg',
      quote: '"Sharing knowledge is the key to growth."',
      bio: 'AI-focused technologist passionate about impactful innovation. Combines leadership with strong execution to deliver real-world solutions. Driven to inspire teams and shape a smarter future.',
      interests: [
        'Artificial Intelligence',
        'Product-Focused ML',
        'Real-World Deployment',
        'Innovation. FORGE → Focus'
      ]
    },
    {
      name: 'YASHASHWINI',
      role: 'STUDENT MENTOR',
      image: '/media/Yashashwini.jpeg',
      quote: '"Sharing knowledge is the key to growth."',
      bio: 'AI-focused technologist passionate about impactful innovation. Combines leadership with strong execution to deliver real-world solutions. Driven to inspire teams and shape a smarter future.',
      interests: [
        'Artificial Intelligence',
        'Product-Focused ML',
        'Real-World Deployment',
        'Innovation. FORGE → Focus'
      ]
    }
  ];

  return (
    <section id="student-mentors" className={styles.container}>
      <h2 className={styles.sectionTitle}>STUDENT MENTORS</h2>
      
      <div className={styles.grid}>
        {mentors.map((mentor, index) => (
          <div key={index} className={styles.cardContent}>
            {/* Left Photo Section */}
            <div className={styles.cardLeft}>
              <Image
                src={mentor.image}
                alt={mentor.name}
                width={400}
                height={500}
                quality={95}
                className={styles.photo}
              />
            </div>

            {/* Right Info Section */}
            <div className={styles.cardRight}>
              <div className={styles.watermark}>R</div>
              
              <h3 className={styles.name}>{mentor.name}</h3>
              <p className={styles.role}>{mentor.role}</p>

              <blockquote className={styles.quote}>
                {mentor.quote}
              </blockquote>

              <h4 className={styles.subsectionTitle}>BIO</h4>
              <p className={styles.desc}>{mentor.bio}</p>

              <h4 className={styles.subsectionTitle}>RESEARCH INTERESTS</h4>
              <div className={styles.tags}>
                {mentor.interests.map((interest, i) => (
                  <span key={i} className={styles.tag}>{interest}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
