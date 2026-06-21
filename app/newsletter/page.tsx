import type { Metadata } from "next";
import { NewsletterForm } from "./newsletter-form";

export const metadata: Metadata = {
  title: "Newsletter",
  description: "Subscribe to our newsletter for the latest posts and updates.",
};

export default function NewsletterPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-4">Newsletter</h1>
      <p className="text-muted mb-8">
        Get the latest posts and updates delivered straight to your inbox.
      </p>
      <NewsletterForm />
    </div>
  );
}
