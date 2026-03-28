"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const PHONE_NUMBER = "5585998635544";
const DEFAULT_MSG = "Ola! Vim pelo site.";

export function WhatsAppFAB({
  className,
  phone = PHONE_NUMBER,
  message = DEFAULT_MSG,
  size = 42,
}: {
  className?: string;
  phone?: string;
  message?: string;
  size?: number;
}) {
  const href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className={cn(
        "fixed bottom-4 right-4 z-999 inline-flex items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#25D366]",
        className
      )}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 32 32"
        aria-hidden="true"
        width={Math.round(size * 0.56)}
        height={Math.round(size * 0.56)}
        fill="currentColor"
      >
        <path d="M19.11 17.37c-.27-.14-1.6-.79-1.85-.88-.25-.09-.43-.14-.62.14-.18.27-.71.88-.87 1.06-.16.18-.32.2-.59.07-.27-.14-1.12-.41-2.13-1.31-.79-.7-1.33-1.57-1.49-1.83-.16-.27-.02-.42.12-.56.12-.12.27-.32.41-.48.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.62-1.49-.85-2.04-.22-.53-.45-.45-.62-.45l-.53-.01c-.18 0-.48.07-.73.34-.25.27-.96.94-.96 2.28s.99 2.65 1.13 2.83c.14.18 1.95 2.99 4.73 4.19.66.28 1.18.45 1.58.57.66.21 1.27.18 1.75.11.53-.08 1.6-.65 1.83-1.28.23-.63.23-1.17.16-1.28-.07-.11-.25-.18-.52-.32z" />
        <path d="M26.53 5.47C23.6 2.54 19.92 1 16 1 8.27 1 2 7.27 2 15c0 2.45.64 4.82 1.86 6.92L2 31l9.26-1.82A13.92 13.92 0 0 0 16 29c7.73 0 14-6.27 14-14 0-3.92-1.54-7.6-4.47-10.53zM16 26.92c-2.24 0-4.42-.6-6.32-1.73l-.45-.27-5.47 1.07 1.05-5.33-.3-.49A11.91 11.91 0 0 1 4.08 15C4.08 8.38 9.38 3.08 16 3.08S27.92 8.38 27.92 15 22.62 26.92 16 26.92z" />
      </svg>
      <span className="sr-only">WhatsApp</span>
    </a>
  );
}
