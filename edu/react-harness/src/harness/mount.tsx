import "../kit/iso.css";
import "./page.css";
import * as React from "react";
import { createRoot } from "react-dom/client";

// Harness only: Next.js would render the server parts on the server; here everything renders on the client.
// ?theme=light|dark overrides the theme baked into the page.
export function mount(figure: React.ReactNode) {
  const asked = new URLSearchParams(window.location.search).get("theme");
  if (asked === "light" || asked === "dark") document.body.dataset.theme = asked;
  createRoot(document.getElementById("root")!).render(<React.StrictMode>{figure}</React.StrictMode>);
}
