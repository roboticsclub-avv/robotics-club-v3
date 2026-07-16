import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import styles from "./Projects.module.css";
import TextAnimation from "./ui/scroll-text";
import { InfiniteMovingCards } from "./ui/infinite-moving-cards";

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
    {
        emoji: "🚗",
        title: "Self-Driving Delivery Cart",
        description:
            "A campus delivery vehicle equipped with sensor fusion, path planning, and GPS checkpoint tracking for autonomous runs.",
        tags: [
            { label: "C++", style: "tagPurple" },
            { label: "GPS Mapping", style: "tagTeal" },
            { label: "Hardware", style: "tagOrange" },
        ],
        link: "#",
    },
    {
        emoji: "🖨️",
        title: "High-Precision 3D Printer",
        description:
            "Custom core-XY 3D printer built from scratch with custom firmware, optimized for fast and ultra-precise technical printing.",
        tags: [
            { label: "Firmware", style: "tagOrange" },
            { label: "Hardware", style: "tagOrange" },
        ],
        link: "#",
    }
];

export default function Projects() {
    const [projectList, setProjectList] = useState([]);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const { data, error } = await supabase
                    .from("projects")
                    .select("*")
                    .order("createdAt", { ascending: false });
                if (error) throw error;
                if (data && data.length > 0) {
                    setProjectList(data);
                } else {
                    setProjectList(PROJECTS);
                }
            } catch (err) {
                console.error("Error loading projects:", err);
                setProjectList(PROJECTS);
            }
        };
        fetchProjects();
    }, []);

    return (
        <section className={`section ${styles.projects}`} id="projects">
            <div className="container">
                <div className={styles.projectsHeader}>
                    <div style={{ marginBottom: "16px" }}>
                        <TextAnimation
                            as="span"
                            text="Our Projects"
                            classname="section-label"
                            direction="up"
                        />
                    </div>
                    <TextAnimation
                        as="h2"
                        text="Built by us"
                        classname="section-title"
                        direction="down"
                    />
                    <p className="section-description" style={{ margin: "0 auto" }}>
                        From concept to competition — explore the projects our members have designed, built, and deployed.
                    </p>
                </div>

                {/* Infinite Moving Cards Carousel containing actual Projects */}
                <div className="mt-16 w-full relative flex items-center justify-center">
                  {projectList.length > 0 && (
                    <InfiniteMovingCards items={projectList} direction="right" speed="slow" />
                  )}
                </div>
            </div>
        </section>
    );
}
