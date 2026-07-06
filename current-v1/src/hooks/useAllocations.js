"use client";

import { useState, useEffect } from "react";

export default function useAllocations(memberId) {
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!memberId) return;
    setLoading(true);
    const timer = setTimeout(() => {
      setAllocations([]);
      setLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, [memberId]);

  return {
    allocations,
    loading,
    error,
  };
}
