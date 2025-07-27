"use client";

import { SessionProvider } from "next-auth/react";
import { type ReactNode } from "react";
import { StoreProvider } from "~/lib/store/store-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <StoreProvider>{children}</StoreProvider>
    </SessionProvider>
  );
}
