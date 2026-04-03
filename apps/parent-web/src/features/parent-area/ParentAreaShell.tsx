"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { isParentGateUnlocked } from "../../lib/parent-gate";
import { parentAreaLinks } from "../parent-gate/parent-area-links";

type ParentAreaShellProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

export function ParentAreaShell({ title, description, children }: ParentAreaShellProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    setUnlocked(isParentGateUnlocked(localStorage));
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return <main>Checking parent gate status…</main>;
  }

  if (!unlocked) {
    return (
      <main>
        <h1>Parent area locked</h1>
        <p>Unlock the local parent gate before accessing this section.</p>
        <p>
          <Link href="/">Go to parent gate</Link>
        </p>
      </main>
    );
  }

  return (
    <main>
      <h1>{title}</h1>
      <p>{description}</p>

      <nav aria-label="Parent area sections">
        <ul>
          {parentAreaLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href}>{link.label}</Link>
            </li>
          ))}
        </ul>
      </nav>

      {children}
    </main>
  );
}
