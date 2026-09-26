"use client";

import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import type { SeasonType } from "@/lib/voxel-tree-generator";
import { track } from "@/lib/track";

// Three.js, kamera & window hanya ada di browser → ssr: false
const WebARModal = dynamic(() => import("@/components/qr/WebARModal"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 flex items-center justify-center bg-stone-950 text-stone-300 text-sm">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-medium tracking-wide">Menyiapkan AR…</p>
      </div>
    </div>
  ),
});

interface Props {
  slug: string;
  destination: string;
  qrText: string;
  season: SeasonType;
  redirectSeconds?: number;
}

export default function ScanExperience({
  slug,
  destination,
  qrText,
  season,
  redirectSeconds = 10,
}: Props) {
  // Tandai cookie 24 jam untuk repeat scanner (scan berikutnya cukup 4 detik)
  useEffect(() => {
    try {
      document.cookie = `oid_scanned_${slug}=1; max-age=86400; path=/; samesite=lax`;
    } catch {
      /* ignore */
    }
  }, [slug]);

  const onRedirect = (reason: "auto" | "click") => {
    track(slug, reason === "click" ? "bubble_click" : "auto_redirect", "scan");
  };

  return (
    <WebARModal
      isOpen
      mode="scan"
      url={destination}
      qrText={qrText}
      season={season}
      redirectSeconds={redirectSeconds}
      onRedirect={onRedirect}
      onClose={() => {
        track(slug, "close", "scan");
        window.location.replace(destination);
      }}
    />
  );
}
