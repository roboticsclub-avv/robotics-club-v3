import styles from "./About.module.css";
import TextAnimation from "./ui/scroll-text";

const STATS = [
    { number: "50+", label: "Members" },
    { number: "15+", label: "Projects" },
    { number: "3", label: "Years Active" },
];

const FEATURES = [
    {
        icon: "🤖",
        title: "Hands-on Building",
        description:
            "Design and build real robots from concept to competition-ready hardware.",
    },
    {
        icon: "🧠",
        title: "AI & Machine Learning",
        description:
            "Integrate intelligent algorithms — computer vision, NLP, and autonomous navigation.",
    },
    {
        icon: "🏆",
        title: "Competitions & Hackathons",
        description:
            "Represent the university at national and international robotics competitions.",
    },
    {
        icon: "🌐",
        title: "Industry Connections",
        description:
            "Network with professionals through workshops, guest lectures, and industry visits.",
    },
];

export default function About() {
    return (
        <section className={`section ${styles.about}`} id="about">
            <div className="container">
                <div className={styles.aboutGrid}>
                    <div className={styles.aboutContent}>
                        <div style={{ marginBottom: '16px' }}>
                            <TextAnimation
                                as="span"
                                text="About Us"
                                classname="section-label"
                                direction="up"
                            />
                        </div>
                        <TextAnimation
                            as="h2"
                            text="Where engineering meets creativity"
                            classname="section-title"
                            direction="down"
                        />
                        <TextAnimation
                            as="p"
                            text="We're a community of passionate engineers, designers, and innovators working together to push the boundaries of what robots can do. From autonomous drones to AI-powered assistants, we turn ideas into reality."
                            classname="section-description"
                            direction="down"
                        />

                        <div className={styles.stats}>
                            {STATS.map((stat) => (
                                <div key={stat.label} className={`glass-card ${styles.statCard}`}>
                                    <div className={styles.statNumber}>{stat.number}</div>
                                    <div className={styles.statLabel}>{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={styles.features}>
                        {FEATURES.map((feature) => (
                            <div key={feature.title} className={`glass-card ${styles.featureItem}`}>
                                <div className={styles.featureIcon}>{feature.icon}</div>
                                <div className={styles.featureContent}>
                                    <h3>{feature.title}</h3>
                                    <p>{feature.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
