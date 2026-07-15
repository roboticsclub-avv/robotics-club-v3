import styles from "./Team.module.css";
import Image from "next/image";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";

const getImageUrl = (url) => {
    if (!url) return `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/media/placeholder.jpg`;
    if (url.startsWith('/')) return `${process.env.NEXT_PUBLIC_BASE_PATH || ''}${url}`;
    return url;
};

export default function Team() {
    const [selectedMember, setSelectedMember] = useState(null);
    const [faculty, setFaculty] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const fetchTeam = async () => {
            try {
                const { data, error } = await supabase
                    .from('core_team')
                    .select('*')
                    .order('display_order', { ascending: true })
                    .order('name', { ascending: true });

                if (error) throw error;

                if (data) {
                    setFaculty(data.filter(m => m.type === 'faculty'));
                    setMembers(data.filter(m => m.type === 'member'));
                }
            } catch (error) {
                console.error("Failed to load core team:", error);
                setErrorMsg(error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchTeam();
    }, []);

    const closeModal = () => {
        setSelectedMember(null);
    };

    return (
        <>
            <section className={`section ${styles.team}`} id="team">
                <div className="container">
                    <div className={`${styles.teamHeader} fade-in`}>
                        <span className="section-label">Our Team</span>
                        <h2 className="section-title">CORE TEAM</h2>
                        <p className="section-description" style={{ margin: "0 auto" }}>
                            The minds behind the machines.
                        </p>
                    </div>

                    {loading ? (
                        <div className="text-cyan-400 font-orbitron text-center py-10 animate-pulse">LOADING ARCHIVES...</div>
                    ) : errorMsg ? (
                        <div className="text-red-400 font-mono text-center py-10 border border-red-500/50 bg-red-900/20 p-4 rounded">
                            <strong>DATA ERROR:</strong> {errorMsg}
                        </div>
                    ) : members.length === 0 && faculty.length === 0 ? (
                        <div className="text-yellow-400 font-mono text-center py-10 opacity-70">
                            No team members found in the secure database.
                        </div>
                    ) : (
                        <>
                            {faculty.length > 0 && (
                                <div className="mb-16">
                                    <h3 className="text-2xl font-orbitron text-white text-center mb-10 tracking-widest border-b border-purple-500/30 pb-4 inline-block mx-auto">FACULTY MEMBERS</h3>
                                    <div>
                                        {faculty.map((member) => (
                                            <div key={member.id} className={`${styles.facultyCard} glass-card`}>
                                                <div className={styles.facultyImageWrapper}>
                                                    <Image
                                                        className={styles.facultyImage}
                                                        src={getImageUrl(member.image_url)}
                                                        alt={member.name}
                                                        fill
                                                        style={{ objectFit: 'cover', objectPosition: 'top' }}
                                                        sizes="(max-width: 768px) 100vw, 33vw"
                                                        priority={true}
                                                    />
                                                    <div className={styles.facultyImageOverlay}></div>
                                                </div>
                                                <div className={styles.facultyContent}>
                                                    <div className={styles.facultyIcon}>
                                                        <svg fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M14.017 21L14.017 18C14.017 16.8954 13.1216 16 12.017 16H9.01703V15C9.01703 14.3196 9.18203 13.6552 9.48803 13.0567C9.64803 12.7444 9.85103 12.455 10.089 12.191L11.977 10.303C12.609 9.671 13.017 8.829 13.017 7.917C13.017 6.031 11.49 4.5 9.60803 4.5H5.01703C4.46475 4.5 4.01703 4.94772 4.01703 5.5V9.5C4.01703 10.0523 4.46475 10.5 5.01703 10.5H8.01703V11.504C8.01703 12.0563 7.56931 12.504 7.01703 12.504H5.01703C3.91246 12.504 3.01703 13.3994 3.01703 14.504V18C3.01703 19.1046 3.91246 20 5.01703 20H14.017V21ZM21.017 21L21.017 18C21.017 16.8954 20.1216 16 19.017 16H16.017V15C16.017 14.3196 16.182 13.6552 16.488 13.0567C16.648 12.7444 16.851 12.455 17.089 12.191L18.977 10.303C19.609 9.671 20.017 8.829 20.017 7.917C20.017 6.031 18.49 4.5 16.608 4.5H12.017C11.4647 4.5 11.017 4.94772 11.017 5.5V9.5C11.017 10.0523 11.4647 10.5 12.017 10.5H15.017V11.504C15.017 12.0563 14.5693 12.504 14.017 12.504H12.017C10.9125 12.504 10.017 13.3994 10.017 14.504V18C10.017 19.1046 10.9125 20 12.017 20H21.017V21Z" />
                                                        </svg>
                                                    </div>
                                                    <h3 className={styles.facultyName}>{member.name}</h3>
                                                    <p className={styles.facultyRole}>{member.role}</p>

                                                    {member.quote && member.quote !== "null" && (
                                                        <blockquote className={styles.facultyQuote}>
                                                            &quot;{member.quote}&quot;
                                                        </blockquote>
                                                    )}

                                                    {member.bio && (
                                                        <div className={styles.contentSection}>
                                                            <h4 className={styles.contentLabel}>BIO</h4>
                                                            <p className={styles.facultyBio}>{member.bio}</p>
                                                        </div>
                                                    )}

                                                    {member.research && (
                                                        <div className={styles.contentSection}>
                                                            <h4 className={styles.contentLabel}>RESEARCH INTERESTS</h4>
                                                            <div className={styles.interestsList}>
                                                                {member.research.split(',').map((interest, idx) => (
                                                                    <span key={idx} className={styles.interestTag}>
                                                                        {interest.trim()}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {members.length > 0 && (
                                <div>
                                    <h3 className="text-2xl font-orbitron text-white text-center mb-10 tracking-widest border-b border-cyan-500/30 pb-4 inline-block mx-auto">STUDENT MEMBERS</h3>
                                    <div className={styles.teamGrid}>
                                        {members.map((member) => (
                                            <div key={member.id} className={`${styles.teamCard} glass-card`}>
                                                <Image
                                                    className={styles.teamImage}
                                                    src={getImageUrl(member.image_url)}
                                                    alt={member.name}
                                                    fill
                                                    style={{ objectFit: 'cover' }}
                                                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                                    priority={false}
                                                />
                                                <div className={styles.teamInfo}>
                                                    <h3 className={styles.memberName}>{member.name}</h3>
                                                    <p className={styles.memberRole}>{member.role}</p>
                                                </div>
                                                <div className={styles.teamHoverOverlay}>
                                                    <p className={styles.memberQuote}>&quot;{member.quote}&quot;</p>
                                                    <button
                                                        className={styles.viewProfileBtn}
                                                        onClick={() => setSelectedMember(member)}
                                                    >
                                                        VIEW PROFILE
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>

            {/* View Profile Modal - Using createPortal to append to body so it escapes CSS transforms */}
            {mounted && selectedMember && createPortal(
                <div className={styles.modalOverlay} onClick={closeModal}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.modalCloseBtn} onClick={closeModal}>×</button>

                        <div className={styles.modalBody}>
                            <div className={styles.modalImageWrapper}>
                                <Image
                                    src={getImageUrl(selectedMember.image_url)}
                                    alt={selectedMember.name}
                                    className={styles.modalImage}
                                    fill
                                    style={{ objectFit: 'cover' }}
                                    sizes="(max-width: 768px) 100vw, 40vw"
                                />
                            </div>

                            <div className={styles.modalInfo}>
                                <h3 className={styles.modalName}>{selectedMember.name}</h3>
                                <p className={styles.modalRole}>{selectedMember.role}</p>

                                {selectedMember.quote && selectedMember.quote !== "null" && (
                                    <blockquote className="border-l-2 border-purple-500 pl-4 py-1 italic text-slate-400 mb-6 text-lg tracking-wide">
                                        &quot;{selectedMember.quote}&quot;
                                    </blockquote>
                                )}

                                {selectedMember.bio && (
                                    <div className={styles.modalSection}>
                                        <h4 className={styles.modalSectionTitle}>BIO</h4>
                                        <p className={styles.modalSectionText}>{selectedMember.bio}</p>
                                    </div>
                                )}

                                {selectedMember.research && (
                                    <div className={styles.modalSection}>
                                        <h4 className={styles.modalSectionTitle}>RESEARCH INTERESTS</h4>
                                        <div className={styles.interestsList}>
                                            {selectedMember.research.split(',').map((interest, idx) => (
                                                <span key={idx} className={styles.interestTag}>
                                                    {interest.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
