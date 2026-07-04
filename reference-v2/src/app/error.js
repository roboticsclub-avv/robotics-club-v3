"use client";

import Link from "next/link";

/**
 * V3: Global error boundary page.
 * Shown when an unhandled error occurs in the app.
 * Must be a Client Component ("use client").
 */
export default function GlobalError({ error, reset }) {
    return (
        <html lang="en">
            <body style={{ background: "#0a0a0a", margin: 0 }}>
                <div style={{
                    minHeight: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "1rem",
                    fontFamily: "system-ui, sans-serif",
                    color: "#f5f5f5"
                }}>
                    <div style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "16px",
                        padding: "3rem",
                        maxWidth: "480px",
                        width: "100%",
                        textAlign: "center"
                    }}>
                        <div style={{
                            display: "inline-block",
                            padding: "4px 12px",
                            background: "rgba(239,68,68,0.2)",
                            border: "1px solid rgba(239,68,68,0.3)",
                            borderRadius: "100px",
                            fontSize: "11px",
                            fontFamily: "monospace",
                            color: "#f87171",
                            marginBottom: "1.5rem"
                        }}>
                            SYSTEM_ERROR // CRITICAL_FAILURE
                        </div>
                        <h1 style={{ fontSize: "2rem", fontWeight: "800", marginBottom: "1rem", color: "#f5f5f5" }}>
                            Something went wrong
                        </h1>
                        <p style={{ color: "#a0a0a0", marginBottom: "0.5rem", lineHeight: 1.6 }}>
                            An unexpected error occurred. Our systems have logged it.
                        </p>
                        {error?.message && (
                            <p style={{
                                fontFamily: "monospace",
                                fontSize: "11px",
                                color: "#666",
                                background: "rgba(0,0,0,0.3)",
                                padding: "8px 12px",
                                borderRadius: "8px",
                                marginBottom: "2rem",
                                wordBreak: "break-all"
                            }}>
                                {error.message}
                            </p>
                        )}
                        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
                            <button
                                onClick={reset}
                                style={{
                                    padding: "12px 24px",
                                    background: "linear-gradient(to right, #7c3aed, #0891b2)",
                                    color: "white",
                                    fontWeight: "700",
                                    borderRadius: "8px",
                                    border: "none",
                                    cursor: "pointer",
                                    fontSize: "13px"
                                }}
                            >
                                TRY AGAIN
                            </button>
                            <a
                                href="/"
                                style={{
                                    padding: "12px 24px",
                                    background: "rgba(255,255,255,0.05)",
                                    color: "#a0a0a0",
                                    fontWeight: "700",
                                    borderRadius: "8px",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    textDecoration: "none",
                                    fontSize: "13px"
                                }}
                            >
                                RETURN HOME
                            </a>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    );
}
