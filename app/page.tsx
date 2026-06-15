import { Header } from "./header";
import { Suspense } from "react";
import HomePageClient from "./page-client";

export default function HomePage() {
  return (
    <>
      <Header />
      <Suspense fallback={<div className="p-4">Loading...</div>}>
        <HomePageClient />
      </Suspense>
    </>
  );
}