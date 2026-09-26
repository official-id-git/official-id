"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import WebARModal from "@/components/qr/WebARModal";
import { SeasonType } from "@/lib/voxel-tree-generator";

function ARContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const toUrl = searchParams.get("to") || "https://official.id";
  const seasonParam = (searchParams.get("season") || "summer") as SeasonType;
  const initialSeason: SeasonType = ["summer", "spring", "autumn"].includes(seasonParam)
    ? seasonParam
    : "summer";

  const handleClose = () => {
    router.push("/");
  };

  return (
    <main className="fixed inset-0 w-full h-full bg-black">
      <WebARModal
        url={toUrl}
        season={initialSeason}
        isOpen={true}
        onClose={handleClose}
      />
    </main>
  );
}

export default function ARPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 bg-stone-950 flex flex-col items-center justify-center text-white">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-medium tracking-wide">Membuka WebAR Magic Tree...</p>
        </div>
      }
    >
      <ARContent />
    </Suspense>
  );
}
