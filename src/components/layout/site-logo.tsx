import Image from "next/image";

import { cn } from "@/lib/utils";

interface SiteLogoProps {
  className?: string;
  priority?: boolean;
}

/**
 * The one and only logo used across the site (header, footer, admin). The
 * PNG is transparent with dark-blue lettering, so on the dark theme it sits
 * on a small white chip — dark blue directly on the dark background would
 * be unreadable.
 */
export function SiteLogo({ className, priority }: SiteLogoProps) {
  return (
    <span className="inline-flex rounded-md dark:bg-white dark:px-2 dark:py-1">
      <Image
        src="/logo.png"
        alt="Logo"
        width={640}
        height={222}
        priority={priority}
        // Served as-is: the optimizer's lossy re-encode turned the thin
        // white stripes inside the letters into mush at this small size.
        unoptimized
        className={cn("h-[5.5rem] w-auto md:h-24 lg:h-32", className)}
      />
    </span>
  );
}
