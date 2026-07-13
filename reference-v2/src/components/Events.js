"use client";

import styles from "./Events.module.css";
import Link from "next/link";
import TextAnimation from "./ui/scroll-text";
import useEvents from "@/hooks/useEvents";

export default function Events() {
    const { events, loading } = useEvents();

    const formatDate = (dateString, isComingSoon) => {
        if (isComingSoon || !dateString) {
            return { month: "TBA", day: "??", weekday: "Soon", time: "" };
        }
        const date = new Date(dateString);
        return {
            month: date.toLocaleString('default', { month: 'short' }).toUpperCase(),
            day: date.getDate().toString().padStart(2, '0'),
            weekday: date.toLocaleDateString('default', { weekday: 'long' }),
            time: "" // We don't have time in the new schema, but can add it later
        };
    };

    return (
        <section className={`section ${styles.events}`} id="events">
            <div className="container">
                <div className={styles.eventsHeader}>
                    <div style={{ marginBottom: "16px" }}>
                        <TextAnimation
                            as="span"
                            text="Upcoming Events"
                            classname="section-label"
                            direction="up"
                        />
                    </div>
                    <TextAnimation
                        as="h2"
                        text="What's happening"
                        classname="section-title"
                        direction="down"
                    />
                    <p className="section-description" style={{ margin: "0 auto" }}>
                        From workshops to hackathons, there's always something exciting on the calendar.
                    </p>
                </div>

                <div className={styles.eventsGrid}>
                    {loading ? (
                        <div className="text-cyan-400 font-orbitron animate-pulse text-center col-span-1 md:col-span-2 lg:col-span-3">LOADING EVENTS...</div>
                    ) : events.length === 0 ? (
                        <div className="text-gray-400 text-center col-span-1 md:col-span-2 lg:col-span-3">No upcoming events scheduled at the moment.</div>
                    ) : (
                        events.map((event) => {
                            const dateInfo = formatDate(event.date, event.comingSoon);

                            return (
                                <div key={event.id} className={`glass-card ${styles.eventCard}`}>
                                    {event.image && (
                                        <div className={styles.eventImageWrapper}>
                                            <img src={event.image} alt={event.title} className={styles.eventImage} loading="lazy" />
                                        </div>
                                    )}
                                    <div className={styles.eventDate}>
                                        <div className={styles.dateIcon}>
                                            <span className={styles.dateMonth}>{dateInfo.month}</span>
                                            <span className={styles.dateDay}>{dateInfo.day}</span>
                                        </div>
                                        <div className={styles.dateText}>
                                            <span className={event.comingSoon ? "text-purple-400 font-bold" : ""}>
                                                {event.comingSoon ? "COMING SOON" : dateInfo.weekday}
                                            </span>
                                            <span>{dateInfo.time}</span>
                                        </div>
                                    </div>
                                    <div className={styles.eventBody}>
                                        <h3 className={styles.eventTitle}>{event.title}</h3>
                                        <p className={styles.eventDescription}>
                                            {event.description?.length > 120
                                                ? event.description.substring(0, 120) + "..."
                                                : event.description}
                                        </p>
                                        <div className="flex items-center gap-4 mt-2">
                                            <Link href={`/event?id=${event.id}`}
                                                className="text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors">
                                                VIEW DETAILS
                                            </Link>
                                            <a href={event.link || "#"} target="_blank" rel="noopener noreferrer"
                                                className={`text-xs ${event.comingSoon ? "opacity-50 cursor-not-allowed" : "text-cyan-400 hover:text-cyan-300"}`}>
                                                {event.comingSoon ? "Registrations Closed" : "Register Here"}
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </section>
    );
}
