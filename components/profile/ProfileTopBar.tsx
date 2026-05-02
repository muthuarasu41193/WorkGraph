"use client";

import Link from "next/link";
import SignOutButton from "./SignOutButton";

export default function ProfileTopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-emerald-100/80 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5 rounded-xl outline-none ring-emerald-900/10 focus-visible:ring-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 shadow-md shadow-emerald-900/15 ring-1 ring-white/25">
            <span className="h-3.5 w-3.5 rounded-sm bg-white/95" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-slate-900 group-hover:text-emerald-900">WorkGraph</span>
        </Link>
        <SignOutButton />
      </div>
    </header>
  );
}
