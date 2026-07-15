"use client";

import { useState, useEffect } from "react";
import styles from "./Gallery.module.css";
import TextAnimation from "./ui/scroll-text";

import { supabase } from "@/lib/supabase";

const DEFAULT_GALLERY_ITEMS = [
    {
        id: 1,
        url: "https://images.unsplash.com/photo-1531746790733-2488c0672045?q=80&w=800&auto=format&fit=crop",
        title: "KICK-OFF WORKSHOP",
        date: "2025-10-15",
        category: "Workshop",
        aspect: "tall"
    },
    {
        id: 2,
        url: "https://images.unsplash.com/photo-1606663889134-b1dedb548b08?q=80&w=800&auto=format&fit=crop",
        title: "ROBOCUP PRACTICE",
        date: "2025-09-20",
        category: "Competition",
        aspect: "wide"
    },
    {
        id: 3,
        url: "https://images.unsplash.com/photo-1581092580497-c2d29cb5f324?q=80&w=800&auto=format&fit=crop",
        title: "DRONE TESTING",
        date: "2025-09-10",
        category: "R&D",
        aspect: "square"
    },
    {
        id: 4,
        url: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=800&auto=format&fit=crop",
        title: "AI SEMINAR",
        date: "2025-08-05",
        category: "Seminar",
        aspect: "tall"
    },
    {
        id: 5,
        url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=800&auto=format&fit=crop",
        title: "ROBOTICS LAB SETUP",
        date: "2025-07-12",
        category: "Lab",
        aspect: "wide"
    },
    {
        id: 6,
        url: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop",
        title: "MCU INTEGRATION WORK",
        date: "2025-06-30",
        category: "Training",
        aspect: "tall"
    },
    {
        id: 7,
        url: "https://images.unsplash.com/photo-1507668077129-56e32842fceb?q=80&w=800&auto=format&fit=crop",
        title: "CYBER PHYSICAL SYSTEMS EXPO",
        date: "2025-05-18",
        category: "Exhibition",
        aspect: "square"
    }
];

export default function Gallery() {
    const [galleryItems, setGalleryItems] = useState(DEFAULT_GALLERY_ITEMS);
    const [lightboxIndex, setLightboxIndex] = useState(null);

    useEffect(() => {
        const fetchGallery = async () => {
            try {
                const { data, error } = await supabase.from('gallery').select('*');
                if (error) throw error;
                if (data && data.length > 0) {
                    setGalleryItems(data);
                }
            } catch (error) {
                console.error("Error loading gallery from Supabase:", error);
            }
        };
        fetchGallery();
    }, []);

    const openLightbox = (index) => {
        setLightboxIndex(index);
        document.body.style.overflow = "hidden"; // Disable scroll when open
    };

    const closeLightbox = () => {
        setLightboxIndex(null);
        document.body.style.overflow = ""; // Restore scroll
    };

    const navigateLightbox = (direction) => {
        if (lightboxIndex === null) return;
        let nextIndex = lightboxIndex + direction;
        if (nextIndex < 0) nextIndex = galleryItems.length - 1;
        if (nextIndex >= galleryItems.length) nextIndex = 0;
        setLightboxIndex(nextIndex);
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (lightboxIndex === null) return;
            if (e.key === "Escape") closeLightbox();
            if (e.key === "ArrowRight") navigateLightbox(1);
            if (e.key === "ArrowLeft") navigateLightbox(-1);
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [lightboxIndex, galleryItems]);

    const activeItem = lightboxIndex !== null ? galleryItems[lightboxIndex] : null;

    return (
        <section className={`section ${styles.gallery}`} id="gallery">
            <div className="container">
                <div className={styles.galleryHeader}>
                    <div style={{ marginBottom: "16px" }}>
                        <TextAnimation
                            as="span"
                            text="Captured Moments"
                            classname="section-label"
                            direction="up"
                        />
                    </div>
                    <TextAnimation
                        as="h2"
                        text="Our Journey in Pixels"
                        classname="section-title"
                        direction="down"
                    />
                    <p className="section-description" style={{ margin: "0 auto" }}>
                        Explore the highlights of our workshops, tests, exhibitions, and lab milestones.
                    </p>
                </div>

                {/* CSS Columns Masonry Grid */}
                <div className={styles.masonryGrid}>
                    {galleryItems.map((item, index) => (
                        <div 
                            key={item.id} 
                            className={`glass-card ${styles.galleryCard}`}
                            onClick={() => openLightbox(index)}
                        >
                            <div className={styles.imageContainer}>
                                <img 
                                    src={item.url} 
                                    alt={item.title} 
                                    className={styles.image} 
                                    loading="lazy" 
                                />
                                <div className={styles.cardOverlay}>
                                    <span className={styles.categoryBadge}>{item.category}</span>
                                    <h3 className={styles.cardTitle}>{item.title}</h3>
                                    <span className={styles.cardDate}>{item.date}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Lightbox Overlay */}
            {activeItem && (
                <div className={styles.lightbox} onClick={closeLightbox}>
                    <div className={styles.lightboxClose} onClick={closeLightbox}>&times;</div>
                    
                    <button 
                        className={`${styles.lightboxArrow} ${styles.arrowLeft}`} 
                        onClick={(e) => { e.stopPropagation(); navigateLightbox(-1); }}
                    >
                        &#10094;
                    </button>

                    <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
                        <img 
                            src={activeItem.url} 
                            alt={activeItem.title} 
                            className={styles.lightboxImage} 
                        />
                        <div className={styles.lightboxCaption}>
                            <span className={styles.lightboxCategory}>{activeItem.category}</span>
                            <h4 className={styles.lightboxTitle}>{activeItem.title}</h4>
                            <p className={styles.lightboxDate}>{activeItem.date}</p>
                        </div>
                    </div>

                    <button 
                        className={`${styles.lightboxArrow} ${styles.arrowRight}`} 
                        onClick={(e) => { e.stopPropagation(); navigateLightbox(1); }}
                    >
                        &#10095;
                    </button>
                </div>
            )}
        </section>
    );
}
