export type ParentAreaLink = {
  href: string;
  label: string;
};

export const parentAreaLinks: ParentAreaLink[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/children", label: "Children" },
  { href: "/progress", label: "Progress" },
  { href: "/sessions", label: "Sessions" },
  { href: "/safety", label: "Safety" },
  { href: "/settings", label: "Settings" }
];
