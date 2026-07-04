"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { showAlert, showConfirm } from "@/lib/alert-store";

// ─── Inline style constants using CSS variables from globals.css ─────────────
const S = {
  page: {
    minHeight: "100vh",
    background: "var(--bg-primary)",
    color: "var(--text-primary)",
    fontFamily: "var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    position: "relative",
    overflowX: "hidden",
  },
  orb1: {
    position: "fixed",
    top: "-200px",
    right: "-200px",
    width: "600px",
    height: "600px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255,107,53,0.07) 0%, transparent 70%)",
    pointerEvents: "none",
    zIndex: 0,
  },
  orb2: {
    position: "fixed",
    bottom: "-200px",
    left: "-200px",
    width: "500px",
    height: "500px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)",
    pointerEvents: "none",
    zIndex: 0,
  },
  inner: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "0 32px",
    position: "relative",
    zIndex: 10,
  },
  // ── Header ──
  header: {
    borderBottom: "1px solid var(--border-subtle)",
    background: "rgba(10,10,10,0.85)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  headerInner: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "0 32px",
    height: "72px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  logoBar: {
    width: "3px",
    height: "28px",
    background: "linear-gradient(180deg, var(--accent-orange) 0%, #7c3aed 100%)",
    borderRadius: "2px",
    flexShrink: 0,
  },
  portalLabel: {
    fontSize: "0.65rem",
    fontWeight: 700,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "var(--accent-orange)",
    lineHeight: 1,
  },
  memberName: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "var(--text-primary)",
    lineHeight: 1.2,
  },
  memberIdBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 12px",
    background: "rgba(255,107,53,0.1)",
    border: "1px solid rgba(255,107,53,0.25)",
    borderRadius: "100px",
    fontSize: "0.72rem",
    fontWeight: 600,
    color: "var(--accent-orange)",
    letterSpacing: "0.08em",
  },
  logoutBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 20px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "var(--radius-sm)",
    color: "var(--text-secondary)",
    fontSize: "0.82rem",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s ease",
    letterSpacing: "0.03em",
  },
  // ── Main content ──
  main: {
    paddingTop: "48px",
    paddingBottom: "80px",
  },
  greeting: {
    marginBottom: "48px",
  },
  sectionLabel: {
    fontSize: "0.65rem",
    fontWeight: 700,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "var(--accent-orange)",
    marginBottom: "8px",
    display: "block",
  },
  pageTitle: {
    fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
    fontWeight: 700,
    color: "var(--text-primary)",
    lineHeight: 1.2,
    marginBottom: "8px",
  },
  pageSubtitle: {
    fontSize: "0.9rem",
    color: "var(--text-secondary)",
    lineHeight: 1.6,
  },
  // ── Section headings ──
  sectionWrapper: {
    marginBottom: "48px",
  },
  sectionHead: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "24px",
  },
  sectionIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1rem",
    flexShrink: 0,
  },
  sectionIconOrange: {
    background: "rgba(255,107,53,0.12)",
    border: "1px solid rgba(255,107,53,0.2)",
  },
  sectionIconPurple: {
    background: "rgba(124,58,237,0.12)",
    border: "1px solid rgba(124,58,237,0.2)",
  },
  sectionTitle: {
    fontSize: "1.1rem",
    fontWeight: 600,
    color: "var(--text-primary)",
    lineHeight: 1.2,
  },
  sectionCount: {
    marginLeft: "auto",
    padding: "3px 10px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "100px",
    fontSize: "0.72rem",
    color: "var(--text-muted)",
    fontWeight: 500,
  },
  // ── Glass card ──
  card: {
    background: "var(--bg-card)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "var(--radius-lg)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    overflow: "hidden",
  },
  // ── Allocations table ──
  tableWrapper: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.875rem",
  },
  th: {
    padding: "14px 20px",
    textAlign: "left",
    fontSize: "0.65rem",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--text-muted)",
    borderBottom: "1px solid var(--border-subtle)",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "16px 20px",
    color: "var(--text-secondary)",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    verticalAlign: "middle",
  },
  tdName: {
    color: "var(--text-primary)",
    fontWeight: 500,
  },
  statusBadge: (status) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    padding: "3px 10px",
    borderRadius: "100px",
    fontSize: "0.7rem",
    fontWeight: 600,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    ...(status === "issued"
      ? {
          background: "rgba(6,182,212,0.1)",
          border: "1px solid rgba(6,182,212,0.25)",
          color: "#06b6d4",
        }
      : {
          background: "rgba(34,197,94,0.1)",
          border: "1px solid rgba(34,197,94,0.25)",
          color: "#22c55e",
        }),
  }),
  returnBtn: {
    padding: "6px 14px",
    background: "rgba(255,107,53,0.08)",
    border: "1px solid rgba(255,107,53,0.2)",
    borderRadius: "var(--radius-sm)",
    color: "var(--accent-orange)",
    fontSize: "0.75rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
    letterSpacing: "0.04em",
  },
  emptyState: {
    padding: "48px 24px",
    textAlign: "center",
    color: "var(--text-muted)",
    fontSize: "0.875rem",
  },
  emptyIcon: {
    fontSize: "2rem",
    marginBottom: "12px",
    opacity: 0.4,
  },
  // ── Request form ──
  formCard: {
    background: "var(--bg-card)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "var(--radius-lg)",
    padding: "32px",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
    marginBottom: "24px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  formLabel: {
    fontSize: "0.7rem",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--text-muted)",
  },
  formSelect: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "var(--radius-sm)",
    padding: "12px 16px",
    color: "var(--text-primary)",
    fontSize: "0.875rem",
    outline: "none",
    cursor: "pointer",
    transition: "border-color 0.2s ease",
    appearance: "none",
    WebkitAppearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%23a0a0a0' d='M1 1l5 5 5-5'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 14px center",
  },
  formInput: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "var(--radius-sm)",
    padding: "12px 16px",
    color: "var(--text-primary)",
    fontSize: "0.875rem",
    outline: "none",
    transition: "border-color 0.2s ease",
    colorScheme: "dark",
  },
  submitBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 28px",
    background: "linear-gradient(135deg, var(--accent-orange) 0%, #d4522a 100%)",
    border: "none",
    borderRadius: "var(--radius-sm)",
    color: "#fff",
    fontSize: "0.875rem",
    fontWeight: 700,
    cursor: "pointer",
    transition: "opacity 0.2s ease, transform 0.2s ease",
    letterSpacing: "0.04em",
    boxShadow: "0 4px 20px rgba(255,107,53,0.25)",
  },
  // ── Success / Error banners ──
  banner: (type) => ({
    padding: "14px 20px",
    borderRadius: "var(--radius-sm)",
    fontSize: "0.85rem",
    fontWeight: 500,
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    ...(type === "success"
      ? {
          background: "rgba(34,197,94,0.08)",
          border: "1px solid rgba(34,197,94,0.2)",
          color: "#22c55e",
        }
      : {
          background: "rgba(239,68,68,0.08)",
          border: "1px solid rgba(239,68,68,0.2)",
          color: "#f87171",
        }),
  }),
  // ── Loading ──
  loadingScreen: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--bg-primary)",
    flexDirection: "column",
    gap: "16px",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid rgba(255,255,255,0.08)",
    borderTopColor: "var(--accent-orange)",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
};

const ROLE_RESPONSIBILITIES = {
  admin: {
    title: "Administrator",
    desc: "Full administrative access: Manage club settings, override allocations, add core team members, and view dashboard analytics."
  },
  technical: {
    title: "Technical Team",
    desc: "All technical related access: Hardware design, project prototyping, technical workshop mentorship, and software integrations."
  },
  ops: {
    title: "Operations Team",
    desc: "Event management: Organizing hackathons, scheduling workshops, managing event logistics, and coordinating public relations."
  },
  data: {
    title: "Data Team",
    desc: "Hardware inventory and Allocation records: Registering hardware items, reconciling stock levels, and audit trail of issued/returned hardware."
  },
  secretary: {
    title: "Secretary",
    desc: "Applications: Reviewing registration applications, admitting new club members, managing applicant statuses, and club communications."
  },
  member: {
    title: "Club Member",
    desc: "Learning and Collaboration: Participate in workshops, contribute to repository projects, follow hardware safety guidelines, and innovate."
  }
};

export default function MemberPortalPage() {
  const router = useRouter();

  // ── Auth / user state ─────────────────────────────────────────────────────
  const [authLoading, setAuthLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  // ── Allocations state ─────────────────────────────────────────────────────
  const [allocations, setAllocations] = useState([]);
  const [allocLoading, setAllocLoading] = useState(false);

  // ── Hardware state (for request form) ────────────────────────────────────
  const [hardwareList, setHardwareList] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [expectedReturn, setExpectedReturn] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formMsg, setFormMsg] = useState(null); // { type: 'success'|'error', text }

  // Secretary data states
  const [memberPoints, setMemberPoints] = useState(0);
  const [pointsHistory, setPointsHistory] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  // ─────────────────────────────────────────────────────────────────────────
  // 1. On mount: check session & fetch user profile
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      // Check active session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      // Fetch user profile from users table
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("uid, email, memberId, role, name, phone, branch, year, section, status")
        .eq("uid", session.user.id)
        .single();

      if (profileError || !profile) {
        await supabase.auth.signOut();
        router.replace("/login");
        return;
      }

      // Reject pending / rejected users
      if (profile.status !== "accepted") {
        await supabase.auth.signOut();
        router.replace("/login");
        return;
      }

      // Fetch secretary database for points and announcements
      try {
        const dbRes = await fetch("/api/secretary/db");
        if (dbRes.ok) {
          const dbData = await dbRes.json();
          const userPointsObj = dbData.points[profile.uid] || { total: 0, history: [] };
          setMemberPoints(userPointsObj.total);
          setPointsHistory(userPointsObj.history);

          const filteredMails = dbData.mails.filter(mail => 
            mail.target === 'all' || mail.target === profile.role
          );
          setAnnouncements(filteredMails);
        }
      } catch (err) {
        console.error("Error fetching secretary database:", err);
      }

      setUserData(profile);
      setAuthLoading(false);
    };

    init();
  }, [router]);

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Once user is loaded, fetch their allocations & available hardware
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userData) return;
    fetchAllocations();
    fetchHardware();
  }, [userData]);

  const fetchAllocations = async () => {
    setAllocLoading(true);
    const { data, error } = await supabase
      .from("allocations")
      .select(
        'id, userId, userName, memberId, itemId, itemName, expectedReturn, status, issuedAt, returnedAt'
      )
      .eq("userId", userData.uid)
      .order("issuedAt", { ascending: false });

    if (!error && data) setAllocations(data);
    setAllocLoading(false);
  };

  const fetchHardware = async () => {
    const { data, error } = await supabase
      .from("hardware")
      .select('id, name, category, totalQuantity, availableQuantity')
      .gt("availableQuantity", 0);

    if (!error && data) {
      setHardwareList(data);
      if (data.length > 0) setSelectedItemId(data[0].id);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Return a hardware item
  // ─────────────────────────────────────────────────────────────────────────
  const handleReturn = async (allocationId, itemId) => {
    const isConfirmed = await showConfirm("Confirm return of this hardware?", "Return Item");
    if (!isConfirmed) return;

    const now = new Date().toISOString();

    // Update allocation status
    const { error: allocErr } = await supabase
      .from("allocations")
      .update({ status: "returned", returnedAt: now })
      .eq("id", allocationId);

    if (allocErr) {
      await showAlert("Failed to process return. Please try again.", "Return Failed");
      return;
    }

    // Increment hardware availableQuantity
    const hwItem = hardwareList.find((h) => h.id === itemId) ||
      allocations.find((a) => a.itemId === itemId);

    if (hwItem) {
      await supabase.rpc("increment_available_quantity", { item_id: itemId }).catch(() => {
        // RPC might not exist – silently fail; admin can reconcile
      });
    }

    // Refresh allocations list
    fetchAllocations();
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 4. Submit hardware request
  // ─────────────────────────────────────────────────────────────────────────
  const handleRequest = async (e) => {
    e.preventDefault();
    setFormMsg(null);

    if (!selectedItemId) {
      setFormMsg({ type: "error", text: "Please select a hardware item." });
      return;
    }
    if (!expectedReturn) {
      setFormMsg({ type: "error", text: "Please select an expected return date." });
      return;
    }

    const selectedHw = hardwareList.find((h) => String(h.id) === String(selectedItemId));
    if (!selectedHw) {
      setFormMsg({ type: "error", text: "Selected item not found. Please refresh." });
      return;
    }

    setFormLoading(true);

    const { error } = await supabase.from("allocations").insert({
      userId: userData.uid,
      userName: userData.name || userData.email,
      memberId: userData.memberId || null,
      itemId: String(selectedHw.id),
      itemName: selectedHw.name,
      expectedReturn,
      status: "issued",
      issuedAt: new Date().toISOString(),
      returnedAt: null,
    });

    if (error) {
      setFormMsg({ type: "error", text: "Request failed: " + error.message });
    } else {
      setFormMsg({ type: "success", text: `Hardware "${selectedHw.name}" allocated successfully!` });
      setExpectedReturn("");
      fetchAllocations();
      fetchHardware();
    }

    setFormLoading(false);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 5. Logout
  // ─────────────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Loading / redirect guard
  // ─────────────────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={S.loadingScreen}>
          <div style={S.spinner} />
          <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", letterSpacing: "0.1em" }}>
            AUTHENTICATING…
          </span>
        </div>
      </>
    );
  }

  if (!userData) return null;

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  const issuedAllocations = allocations.filter((a) => a.status === "issued");
  const returnedAllocations = allocations.filter((a) => a.status === "returned");

  return (
    <>
      {/* Global keyframe injected via style tag */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .portal-animate { animation: fadeUp 0.5s ease forwards; }
        .portal-animate-delay { animation: fadeUp 0.5s 0.12s ease both; }
        .portal-animate-delay2 { animation: fadeUp 0.5s 0.24s ease both; }

        .logout-btn:hover {
          background: rgba(255,255,255,0.08) !important;
          border-color: rgba(255,255,255,0.15) !important;
          color: var(--text-primary) !important;
        }
        .return-btn:hover {
          background: rgba(255,107,53,0.18) !important;
          border-color: rgba(255,107,53,0.4) !important;
        }
        .submit-btn:hover:not(:disabled) {
          opacity: 0.88;
          transform: translateY(-1px);
        }
        .submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .form-select:focus, .form-input:focus {
          border-color: rgba(255,107,53,0.45) !important;
          box-shadow: 0 0 0 3px rgba(255,107,53,0.08);
        }
        .hw-row:hover td {
          background: rgba(255,255,255,0.02);
        }
        @media (max-width: 640px) {
          .form-grid { grid-template-columns: 1fr !important; }
          .header-inner { padding: 0 20px !important; }
          .page-inner { padding: 0 20px !important; }
        }
      `}</style>

      <div style={S.page}>
        {/* Background orbs */}
        <div style={S.orb1} />
        <div style={S.orb2} />

        {/* ── HEADER ──────────────────────────────────────────────── */}
        <header style={S.header}>
          <div style={S.headerInner} className="header-inner">
            <div style={S.headerLeft}>
              <div style={S.logoBar} />
              <div>
                <span style={S.portalLabel}>Member Portal</span>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "2px" }}>
                  <span style={S.memberName}>{userData.name || userData.email}</span>
                  {userData.memberId && (
                    <span style={S.memberIdBadge}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <rect x="0.5" y="0.5" width="9" height="9" rx="1.5" stroke="currentColor" strokeOpacity="0.7"/>
                        <rect x="2.5" y="3" width="5" height="1" rx="0.5" fill="currentColor"/>
                        <rect x="2.5" y="5" width="3.5" height="1" rx="0.5" fill="currentColor"/>
                      </svg>
                      {userData.memberId}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {userData && ['admin', 'technical', 'ops', 'data', 'secretary'].includes(userData.role) && (
                <button
                  style={{ ...S.logoutBtn, color: "#a78bfa", borderColor: "rgba(167,139,250,0.25)", background: "rgba(167,139,250,0.07)" }}
                  onClick={() => router.push('/dashboard')}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "4px" }}>
                    <rect x="3" y="3" width="7" height="9" stroke="currentColor" />
                    <rect x="14" y="3" width="7" height="5" stroke="currentColor" />
                    <rect x="14" y="12" width="7" height="9" stroke="currentColor" />
                    <rect x="3" y="16" width="7" height="5" stroke="currentColor" />
                  </svg>
                  Dashboard
                </button>
              )}
              <button
                style={{ ...S.logoutBtn, color: "var(--accent-orange)", borderColor: "rgba(255,107,53,0.25)", background: "rgba(255,107,53,0.07)" }}
                onClick={() => router.push('/')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M3 12L12 3l9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Home
              </button>
              <button
                className="logout-btn"
                style={S.logoutBtn}
                onClick={handleLogout}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M5 2H2.5A1.5 1.5 0 001 3.5v7A1.5 1.5 0 002.5 12H5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  <path d="M9.5 10L13 7m0 0L9.5 4M13 7H5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* ── MAIN ────────────────────────────────────────────────── */}
        <main style={{ ...S.main }}>
          <div style={S.inner} className="page-inner">

            {/* Greeting */}
            <div style={S.greeting} className="portal-animate">
              <span style={S.sectionLabel}>Welcome back</span>
              <h1 style={S.pageTitle}>
                Hey, {userData.name?.split(" ")[0] || "Member"} 👋
              </h1>
              <p style={S.pageSubtitle}>
                Manage your hardware allocations and submit new requests below.
                {userData.branch && ` • ${userData.branch}`}
                {userData.year && ` Year ${userData.year}`}
                {userData.section && ` — Section ${userData.section}`}
              </p>
            </div>

            {/* Responsibilities Banner */}
            {ROLE_RESPONSIBILITIES[userData.role] && (
              <div 
                style={{
                  ...S.card,
                  padding: "20px 24px",
                  marginBottom: "32px",
                  background: "rgba(255, 255, 255, 0.01)",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px"
                }} 
                className="portal-animate-delay"
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "1rem" }}>⚡</span>
                  <span style={{ 
                    fontSize: "0.68rem", 
                    fontWeight: 700, 
                    letterSpacing: "0.15em", 
                    textTransform: "uppercase", 
                    color: "var(--accent-orange)"
                  }}>
                    Your Responsibilities ({ROLE_RESPONSIBILITIES[userData.role].title})
                  </span>
                </div>
                <p style={{ 
                  fontSize: "0.85rem", 
                  color: "var(--text-secondary)", 
                  lineHeight: "1.5",
                  margin: 0 
                }}>
                  {ROLE_RESPONSIBILITIES[userData.role].desc}
                </p>
              </div>
            )}

            {/* Announcements and Points Grid */}
            <div 
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "24px",
                marginBottom: "40px"
              }}
              className="portal-animate-delay"
            >
              {/* Card 1: Attendance Points */}
              <div 
                style={{
                  ...S.card,
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  background: "rgba(255, 255, 255, 0.01)",
                  border: "1px solid rgba(255, 255, 255, 0.05)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "1.2rem" }}>🎯</span>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.05em", color: "var(--text-primary)" }}>
                      ATTENDANCE SCORE
                    </span>
                  </div>
                  <span 
                    style={{ 
                      fontSize: "1.25rem", 
                      fontWeight: 800, 
                      color: memberPoints >= 0 ? "rgba(34, 197, 94, 0.9)" : "rgba(239, 68, 68, 0.9)",
                      fontFamily: "monospace" 
                    }}
                  >
                    {memberPoints >= 0 ? `+${memberPoints}` : memberPoints} pts
                  </span>
                </div>
                
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "14px", flexGrow: 1 }}>
                  <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "8px" }}>
                    Recent Activity Log
                  </div>
                  {pointsHistory.length === 0 ? (
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic", marginTop: "8px", margin: 0 }}>
                      No points adjustments recorded yet.
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "120px", overflowY: "auto" }}>
                      {pointsHistory.slice(0, 3).map(h => (
                        <div key={h.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "start", fontSize: "0.78rem" }}>
                          <div style={{ paddingRight: "10px" }}>
                            <div style={{ color: "var(--text-secondary)", fontWeight: 500, lineHeight: 1.3 }}>{h.reason}</div>
                            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "2px" }}>{h.date}</div>
                          </div>
                          <span style={{ 
                            fontWeight: 700, 
                            fontFamily: "monospace",
                            color: h.pointsChange >= 0 ? "#22c55e" : "#ef4444",
                            whiteSpace: "nowrap"
                          }}>
                            {h.pointsChange >= 0 ? `+${h.pointsChange}` : h.pointsChange}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Card 2: Recent Announcements */}
              <div 
                style={{
                  ...S.card,
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  background: "rgba(255, 255, 255, 0.01)",
                  border: "1px solid rgba(255, 255, 255, 0.05)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                  <span style={{ fontSize: "1.2rem" }}>📢</span>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.05em", color: "var(--text-primary)" }}>
                    LATEST ANNOUNCEMENTS
                  </span>
                </div>

                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "14px", flexGrow: 1 }}>
                  {announcements.length === 0 ? (
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic", margin: 0 }}>
                      No announcements posted for you.
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "120px", overflowY: "auto" }}>
                      {announcements.slice(0, 2).map(ann => (
                        <div key={ann.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", paddingBottom: "10px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--accent-orange)" }}>
                              {ann.subject}
                            </span>
                            <span style={{ fontSize: "0.62rem", color: "var(--text-muted)", fontFamily: "monospace" }}>
                              {ann.date}
                            </span>
                          </div>
                          <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: "1.4", margin: 0 }}>
                            {ann.body}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── SECTION: MY HARDWARE ────────────────────────────── */}
            <div style={S.sectionWrapper} className="portal-animate-delay">
              <div style={S.sectionHead}>
                <div style={{ ...S.sectionIcon, ...S.sectionIconOrange }}>📦</div>
                <span style={S.sectionTitle}>My Hardware</span>
                <span style={S.sectionCount}>
                  {allocLoading ? "…" : `${issuedAllocations.length} active`}
                </span>
              </div>

              <div style={S.card}>
                {allocLoading ? (
                  <div style={S.emptyState}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                      <div style={{ ...S.spinner, width: "20px", height: "20px", borderWidth: "2px" }} />
                      <span>Loading allocations…</span>
                    </div>
                  </div>
                ) : allocations.length === 0 ? (
                  <div style={S.emptyState}>
                    <div style={S.emptyIcon}>📭</div>
                    <p style={{ color: "var(--text-muted)", marginBottom: "4px" }}>No hardware allocated yet</p>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                      Use the form below to request items.
                    </p>
                  </div>
                ) : (
                  <div style={S.tableWrapper}>
                    <table style={S.table}>
                      <thead>
                        <tr>
                          <th style={S.th}>Item</th>
                          <th style={S.th}>Qty</th>
                          <th style={S.th}>Expected Return</th>
                          <th style={S.th}>Issued At</th>
                          <th style={S.th}>Status</th>
                          <th style={S.th}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allocations.map((alloc) => (
                          <tr key={alloc.id} className="hw-row" style={{ transition: "background 0.15s ease" }}>
                            <td style={{ ...S.td, ...S.tdName }}>{alloc.itemName || "—"}</td>
                            <td style={S.td}>1</td>
                            <td style={S.td}>
                              {alloc.expectedReturn
                                ? new Date(alloc.expectedReturn).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "—"}
                            </td>
                            <td style={S.td}>
                              {alloc.issuedAt
                                ? new Date(alloc.issuedAt).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "—"}
                            </td>
                            <td style={S.td}>
                              <span style={S.statusBadge(alloc.status)}>
                                {alloc.status === "issued" ? "⬤" : "✓"}&nbsp;{alloc.status}
                              </span>
                            </td>
                            <td style={S.td}>
                              {alloc.status === "issued" ? (
                                <button
                                  className="return-btn"
                                  style={S.returnBtn}
                                  onClick={() => handleReturn(alloc.id, alloc.itemId)}
                                >
                                  Return
                                </button>
                              ) : (
                                <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                                  Returned {alloc.returnedAt
                                    ? new Date(alloc.returnedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
                                    : ""}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* ── SECTION: REQUEST HARDWARE ────────────────────────── */}
            <div style={S.sectionWrapper} className="portal-animate-delay2">
              <div style={S.sectionHead}>
                <div style={{ ...S.sectionIcon, ...S.sectionIconPurple }}>🔧</div>
                <span style={S.sectionTitle}>Request Hardware</span>
              </div>

              <div style={S.formCard}>
                {/* Form banner */}
                {formMsg && (
                  <div style={S.banner(formMsg.type)}>
                    {formMsg.type === "success" ? "✓" : "⚠"}&nbsp;{formMsg.text}
                  </div>
                )}

                {hardwareList.length === 0 ? (
                  <div style={{ ...S.emptyState, padding: "32px 0" }}>
                    <div style={S.emptyIcon}>🚫</div>
                    <p style={{ color: "var(--text-muted)" }}>No hardware available at the moment.</p>
                  </div>
                ) : (
                  <form onSubmit={handleRequest}>
                    <div style={S.formGrid} className="form-grid">
                      {/* Item selector */}
                      <div style={S.formGroup}>
                        <label style={S.formLabel}>Select Item</label>
                        <select
                          className="form-select"
                          style={S.formSelect}
                          value={selectedItemId}
                          onChange={(e) => setSelectedItemId(e.target.value)}
                          required
                        >
                          {hardwareList.map((hw) => (
                            <option
                              key={hw.id}
                              value={hw.id}
                              style={{ background: "#111", color: "#f5f5f5" }}
                            >
                              {hw.name}
                              {hw.category ? ` (${hw.category})` : ""}
                              {" — "}
                              {hw.availableQuantity} available
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Expected return date */}
                      <div style={S.formGroup}>
                        <label style={S.formLabel}>Expected Return Date</label>
                        <input
                          type="date"
                          className="form-input"
                          style={S.formInput}
                          value={expectedReturn}
                          min={new Date().toISOString().split("T")[0]}
                          onChange={(e) => setExpectedReturn(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {/* Hint */}
                    <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "20px" }}>
                      You are responsible for returning items by the selected date. Late returns may affect future access.
                    </p>

                    <button
                      type="submit"
                      className="submit-btn"
                      style={S.submitBtn}
                      disabled={formLoading}
                    >
                      {formLoading ? (
                        <>
                          <div style={{ ...S.spinner, width: "14px", height: "14px", borderWidth: "2px" }} />
                          Submitting…
                        </>
                      ) : (
                        <>
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M7 1v12M1 7h12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                          Request Hardware
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>

          </div>
        </main>
      </div>
    </>
  );
}
