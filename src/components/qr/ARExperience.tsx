"use client";

import React from "react";
import dynamic from "next/dynamic";
import { SeasonType } from "@/lib/voxel-tree-generator";

const WebARModal = dynamic(() => import("@/components/qr/WebARModal"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-stone-950 flex flex-col items-center justify-center text-white z-10">
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
      <p className="text-xs text-stone-300 font-medium tracking-wide">Membuka WebAR Magic Portal...</p>
    </div>
  ),
});

interface ARExperienceProps {
  url: string;
  qrText?: string;
  season?: SeasonType;
  redirectSeconds?: number;
}

export default function ARExperience({
  url,
  qrText,
  season = "summer",
  redirectSeconds = 10,
}: ARExperienceProps) {
  const handleClose = () => {
    if (typeof window !== "undefined" && url) {
      window.location.replace(url);
    }
  };

  return (
    <WebARModal
      url={url}
      qrText={qrText}
      season={season}
      isOpen={true}
      mode="scan"
      redirectSeconds={redirectSeconds}
      onClose={handleClose}
    />
  );
}
