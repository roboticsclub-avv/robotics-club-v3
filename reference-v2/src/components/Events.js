"use client";

import { useState, useEffect } from "react";
import styles from "./Events.module.css";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function Events() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const { data, error } = await supabase.from('events').select('*');
                if (error) throw error;

                const evts = data || [];

                // Sort by comingSoon first, then date
                evts.sort((a, b) => {
                    if (a.comingSoon === b.comingSoon) {
                        return new Date(a.date) - new Date(b.date);
                    }
                    return a.comingSoon ? -1 : 1;
                });

                setEvents(evts);
            } catch (error) {
                console.error("Error fetching events:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

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
                <div className={`${styles.eventsHeader} fade-in`}>
                    <span className="section-label">Upcoming Events</span>
                    <h2 className="section-title">What&apos;s happening</h2>
                    <p className="section-description" style={{ margin: "0 auto" }}>
                        From workshops to hackathons, there&apos;s always something exciting on the calendar.
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
                                <div key={event.id} className={`glass-card ${styles.eventCard} fade-in`}>
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
