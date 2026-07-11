"use client";

import { useState, useEffect } from "react";

export default function useEvents(options = {}) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Placeholder fetching logic
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const timer = setTimeout(() => {
      setEvents([]);
      setLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, [options.upcomingOnly]);

  const refresh = async () => {
    console.log("Events refresh requested (placeholder).");
  };

  return {
    events,
    loading,
    error,
    refresh,
  };
}
