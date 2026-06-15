import React, { Suspense } from "react";
import HomePageClient from "./page-client";

export default function HomePage() {
  return (
    <Suspense fallback={<div className="p-4">Loading...</div>}>
      <HomePageClient />
    </Suspense>
  );
}