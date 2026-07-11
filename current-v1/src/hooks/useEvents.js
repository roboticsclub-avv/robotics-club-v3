"use client";

import { useState, useEffect, useCallback } from "react";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "@/lib/firebase/firestore";

export default function useEvents(options = {}) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, "events"));
      const querySnapshot = await getDocs(q);
      const evts = [];
      querySnapshot.forEach((doc) => {
        evts.push({ id: doc.id, ...doc.data() });
      });

      // Sort by comingSoon first, then date
      evts.sort((a, b) => {
        if (a.comingSoon === b.comingSoon) {
          return new Date(a.date) - new Date(b.date);
        }
        return a.comingSoon ? -1 : 1;
      });

      setEvents(evts);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("cached_events", JSON.stringify(evts));
      }
    } catch (err) {
      console.error("Error fetching events from Firestore:", err);
      setError(err.message || "Failed to fetch events");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Read cache first if available to prevent flash
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem("cached_events");
      if (cached) {
        setEvents(JSON.parse(cached));
        setLoading(false);
      }
    }
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    loading,
    error,
    refresh: fetchEvents,
  };
}
