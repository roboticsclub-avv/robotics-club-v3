import styles from "./Projects.module.css";

const PROJECTS = [
    {
        emoji: "🚁",
        title: "Autonomous Drone Navigation",
        description:
            "A drone that navigates complex environments using LiDAR and SLAM algorithms, capable of indoor mapping and obstacle avoidance.",
        tags: [
            { label: "ROS2", style: "tagPurple" },
            { label: "Computer Vision", style: "tagTeal" },
            { label: "Hardware", style: "tagOrange" },
        ],
        link: "#",
    },
    {
        emoji: "🦾",
        title: "Robotic Arm: Pick & Place",
        description:
            "A 6-DOF robotic arm with custom inverse kinematics, capable of sorting objects by color and shape using a trained CNN.",
        tags: [
            { label: "Python", style: "tagPurple" },
            { label: "Deep Learning", style: "tagTeal" },
        ],
        link: "#",
    },
    {
        emoji: "🤖",
        title: "Sumo Bot — Competition Ready",
        description:
            "An autonomous sumo wrestling robot with real-time opponent tracking, edge detection, and aggressive push-back strategy.",
        tags: [
            { label: "Arduino", style: "tagOrange" },
            { label: "Sensors", style: "tagTeal" },
            { label: "Competition", style: "tagPurple" },
        ],
        link: "#",
    },
];

export default function Projects() {
    return (
        <section className={`section ${styles.projects}`} id="projects">
            <div className="container">
                <div className={`${styles.projectsHeader} fade-in`}>
                    <span className="section-label">Our Projects</span>
                    <h2 className="section-title">Built by us</h2>
                    <p className="section-description" style={{ margin: "0 auto" }}>
                        From concept to competition — explore the projects our members
                        have designed, built, and deployed.
                    </p>
                </div>

                <div className={styles.projectsGrid}>
                    {PROJECTS.map((project) => (
                        <div key={project.title} className={`glass-card ${styles.projectCard} fade-in`}>
                            <div className={styles.projectImage}>
                                <div className={styles.projectImagePlaceholder}>
                                    {project.emoji}
                                </div>
                            </div>
                            <div className={styles.projectBody}>
                                <h3 className={styles.projectTitle}>{project.title}</h3>
                                <p className={styles.projectDescription}>
                                    {project.description}
                                </p>
                                <div className={styles.projectTags}>
                                    {project.tags.map((tag) => (
                                        <span
                                            key={tag.label}
                                            className={`${styles.tag} ${styles[tag.style]}`}
                                        >
                                            {tag.label}
                                        </span>
                                    ))}
                                </div>
                                <a href={project.link} className={styles.projectLink}>
                                    View Project <span>→</span>
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
