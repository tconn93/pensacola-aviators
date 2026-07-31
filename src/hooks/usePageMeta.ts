import { useEffect } from "react";

const BASE = "Pensacola Aviators Rugby";

/**
 * Updates document title + meta description per page (SPA-friendly SEO).
 */
export function usePageMeta(title?: string, description?: string) {
  useEffect(() => {
    document.title = title ? `${title} — ${BASE}` : BASE;
    if (description) {
      let el = document.querySelector('meta[name="description"]');
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("name", "description");
        document.head.appendChild(el);
      }
      el.setAttribute("content", description);
    }
  }, [title, description]);
}
