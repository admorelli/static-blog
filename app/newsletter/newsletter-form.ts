"use client";

import { useState, createElement } from "react";

const providerEndpoint =
  process.env.NEXT_PUBLIC_NEWSLETTER_ENDPOINT || "";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    if (!providerEndpoint) {
      setStatus("error");
      setMessage("Newsletter is not configured yet. Check back later.");
      return;
    }

    try {
      const res = await fetch(providerEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      setStatus("success");
      setMessage("Subscription successful!");
      setEmail("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setStatus("error");
      setMessage(msg);
    }
  };

  return createElement(
    "form",
    { onSubmit: handleSubmit, className: "space-y-4" },
    createElement(
      "label",
      { className: "block text-sm font-medium", key: "email-label" },
      "Email address",
      createElement("input", {
        type: "email",
        required: true,
        value: email,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value),
        className: "mt-1 w-full border rounded-md p-2 bg-card-bg border-card-border text-foreground",
        placeholder: "you@example.com",
        key: "email-input",
      })
    ),
    createElement(
      "button",
      {
        type: "submit",
        disabled: status === "loading",
        className: "inline-flex items-center px-4 py-2 rounded-md bg-accent text-white hover:bg-accent-hover disabled:opacity-50",
        key: "submit-btn",
      },
      status === "loading" ? "Subscribing..." : "Subscribe"
    ),
    message
      ? createElement(
          "p",
          {
            className: status === "error" ? "text-red-500" : "text-green-600",
            key: "message",
          },
          message
        )
      : null
  );
}
