import "../kit/iso.css";
import "./page.css";
import "@edu/react/page.css";
import * as React from "react";
import { createRoot } from "react-dom/client";

// Teaching pages (stage 2): same shell as mount.tsx, StrictMode on (edu-kit's destroy() makes the double mount clean).
export function mountEdu(app: React.ReactNode) {
  const asked = new URLSearchParams(window.location.search).get("theme");
  if (asked === "light" || asked === "dark") document.body.dataset.theme = asked;
  createRoot(document.getElementById("root")!).render(<React.StrictMode>{app}</React.StrictMode>);
}
