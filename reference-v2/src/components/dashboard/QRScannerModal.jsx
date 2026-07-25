"use client";

import React, { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "@/lib/supabase";

export default function QRScannerModal({ event, checkpoint, onClose, onScanComplete }) {
  const [scanResult, setScanResult] = useState(null); // { status, message, member_name, member_id, roll_number, photo_url, scanned_at }
  const [scanning, setScanning] = useState(true);
  const [scannerError, setScannerError] = useState("");
  const [processingScan, setProcessingScan] = useState(false);

  const html5QrcodeRef = useRef(null);
  const scannerContainerId = "html5qr-code-full-region";
  const lastScannedTokenRef = useRef(null);
  const scanCooldownTimerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const startScanner = async () => {
      try {
        setScannerError("");
        const html5Qrcode = new Html5Qrcode(scannerContainerId);
        html5QrcodeRef.current = html5Qrcode;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

        await html5Qrcode.start(
          { facingMode: "environment" },
          config,
          onScanSuccess,
          onScanFailure
        );
      } catch (err) {
        console.error("[QRScannerModal] Camera init error:", err);
        if (isMounted) {
          setScannerError(
            "Could not access camera. Please check camera permissions in your browser or try selecting an alternative camera."
          );
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, []);

  const stopScanner = async () => {
    if (html5QrcodeRef.current) {
      try {
        if (html5QrcodeRef.current.isScanning) {
          await html5QrcodeRef.current.stop();
        }
        await html5QrcodeRef.current.clear();
      } catch (err) {
        console.warn("[QRScannerModal] Cleanup warning:", err);
      }
    }
  };

  const onScanFailure = (error) => {
    // Normal frame noise when no QR code is visible in the frame - ignore
  };

  const onScanSuccess = async (decodedText) => {
    if (processingScan) return;

    try {
      // Parse QR Payload JSON
      let qrData = null;
      try {
        qrData = JSON.parse(decodedText);
      } catch (e) {
        // Fallback for raw token string
        qrData = { token: decodedText };
      }

      const qrToken = qrData?.token || decodedText;

      // Cooldown prevention for exact same token scanned twice in 3 seconds
      if (lastScannedTokenRef.current === qrToken) {
        return;
      }

      lastScannedTokenRef.current = qrToken;
      setProcessingScan(true);

      // Execute Atomic Database RPC call
      const { data: rpcRes, error: rpcErr } = await supabase.rpc("mark_event_attendance", {
        p_qr_token: qrToken,
        p_event_id: event.id,
        p_checkpoint_id: checkpoint.id,
      });

      if (rpcErr) {
        setScanResult({
          status: "ATTENDANCE_PROCESSING_ERROR",
          message: "Database transaction error encountered while processing scan.",
        });
      } else {
        setScanResult(rpcRes);
        if (onScanComplete) onScanComplete(rpcRes);
      }

      // Auto clear feedback after 2.5s and reset cooldown to allow scanning next person
      if (scanCooldownTimerRef.current) clearTimeout(scanCooldownTimerRef.current);
      scanCooldownTimerRef.current = setTimeout(() => {
        setScanResult(null);
        setProcessingScan(false);
        lastScannedTokenRef.current = null;
      }, 2500);
    } catch (err) {
      console.error("[QRScannerModal] Scan processing error:", err);
      setScanResult({
        status: "ATTENDANCE_PROCESSING_ERROR",
        message: "Invalid QR format or processing exception.",
      });
      setProcessingScan(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-inter animate-fade-in">
      <div className="bg-[#0f172a] border border-white/10 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 relative overflow-hidden text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-full">
              LIVE QR ATTENDANCE SCANNER
            </span>
            <h3 className="text-base font-extrabold font-orbitron text-white mt-2">
              {event?.title || "Event Attendance"}
            </h3>
            <p className="text-xs font-mono text-purple-400">
              Active Checkpoint: <strong className="text-white">{checkpoint?.checkpoint_name}</strong>
            </p>
          </div>

          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="text-gray-400 hover:text-white p-2 rounded-full bg-white/[0.04] border border-white/10 transition-all hover:scale-110"
          >
            ✕
          </button>
        </div>

        {/* Camera Feed Container */}
        <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-cyan-500/30 aspect-square max-w-[320px] mx-auto flex items-center justify-center">
          <div id={scannerContainerId} className="w-full h-full" />

          {/* Target Scanner Overlay Guide Box */}
          <div className="absolute inset-0 border-2 border-dashed border-cyan-400/40 pointer-events-none rounded-2xl flex items-center justify-center">
            <div className="w-48 h-48 border-2 border-cyan-400 rounded-xl relative animate-pulse" />
          </div>

          {processingScan && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center text-cyan-400 font-mono text-xs font-bold animate-pulse">
              Processing scan...
            </div>
          )}
        </div>

        {scannerError && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-mono text-center">
            {scannerError}
          </div>
        )}

        {/* CONTINUOUS VERIFICATION RESULT OVERLAY CARD */}
        {scanResult && (
          <div
            className={`p-4 rounded-2xl border space-y-3 font-mono text-xs animate-fade-in ${
              scanResult.status === "RECORDED"
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                : scanResult.status === "ALREADY_MARKED"
                ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                : "bg-red-500/15 border-red-500/40 text-red-300"
            }`}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="font-orbitron font-extrabold uppercase text-xs tracking-wider flex items-center gap-2">
                {scanResult.status === "RECORDED" && <span>✓ ATTENDANCE RECORDED</span>}
                {scanResult.status === "ALREADY_MARKED" && <span>⚠️ ALREADY MARKED</span>}
                {scanResult.status !== "RECORDED" && scanResult.status !== "ALREADY_MARKED" && (
                  <span>❌ SCAN REJECTED</span>
                )}
              </span>

              <span className="text-[10px] font-mono opacity-80">
                {scanResult.scanned_at || scanResult.previous_scanned_at
                  ? new Date(scanResult.scanned_at || scanResult.previous_scanned_at).toLocaleTimeString()
                  : "Just Now"}
              </span>
            </div>

            {/* Visual Photo Verification Box */}
            {(scanResult.member_name || scanResult.photo_url) && (
              <div className="flex items-center gap-4 bg-black/40 p-3 rounded-xl border border-white/10">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-800 border border-white/20 shrink-0">
                  {scanResult.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={scanResult.photo_url}
                      alt={scanResult.member_name || "Member"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-orbitron font-bold text-cyan-400 text-lg">
                      {scanResult.member_name?.charAt(0) || "M"}
                    </div>
                  )}
                </div>

                <div className="space-y-1 min-w-0 flex-1">
                  <h4 className="font-bold text-white text-sm truncate font-inter">
                    {scanResult.member_name || "Member"}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] text-gray-300 flex-wrap">
                    <span>RC ID: <strong className="text-cyan-300">{scanResult.member_id || "N/A"}</strong></span>
                    <span>•</span>
                    <span>Roll: <strong className="text-purple-300">{scanResult.roll_number || "N/A"}</strong></span>
                  </div>
                </div>
              </div>
            )}

            <p className="text-[11px] leading-relaxed">
              {scanResult.message || "Attendance process completed."}
            </p>
          </div>
        )}

        {/* Footer controls */}
        <div className="flex items-center justify-between border-t border-white/10 pt-3">
          <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Continuous Scan Loop Active
          </span>

          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white font-orbitron font-bold text-xs rounded-xl transition"
          >
            Close Scanner
          </button>
        </div>
      </div>
    </div>
  );
}
