"use client";

import Link from "next/link";
import { Save } from "lucide-react";
import SignOutButton from "./SignOutButton";
import { emitProfileSaveStart, emitSaveAllBegin, emitSaveAllRequested } from "../../lib/profile-save-events";

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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              emitSaveAllBegin(["header", "links", "skills", "experience", "education"]);
              emitProfileSaveStart("all sections");
              emitSaveAllRequested();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900 transition hover:bg-emerald-100"
          >
            <Save className="h-3.5 w-3.5" aria-hidden />
            Save all changes
          </button>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
