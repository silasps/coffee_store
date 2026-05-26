"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { CafeLoaderOverlay } from "@/components/ui/cafe-loader";

function NavigationWatcher() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  // Hide loader whenever the route settles on a new path
  useEffect(() => {
    setLoading(false);
  }, [pathname, searchParams]);

  // Show loader when the user clicks any same-origin link
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href) return;
      // Only intercept relative / same-origin links that aren't anchors
      if (href.startsWith("http") || href.startsWith("mailto") || href.startsWith("#")) return;
      setLoading(true);
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return <CafeLoaderOverlay visible={loading} />;
}

// Needs Suspense because useSearchParams() requires it in Next.js App Router
export function PageTransitionLoader() {
  return (
    <Suspense fallback={null}>
      <NavigationWatcher />
    </Suspense>
  );
}
