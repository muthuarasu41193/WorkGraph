"use client";

import Link from "next/link";
import { Save } from "lucide-react";
import SignOutButton from "./SignOutButton";
import { emitProfileSaveStart, emitSaveAllBegin, emitSaveAllRequested } from "../../lib/profile-save-events";

export default function ProfileTopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#DADCE0] bg-[#FFFFFF]/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-4 px-6 py-3">
        <Link href="/" className="group flex items-center gap-2.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[#1A73E8]">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E8F0FE] ring-1 ring-[#DADCE0]">
            <span className="h-3.5 w-3.5 rounded-sm bg-white/95" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-[#1D1D1F] group-hover:text-[#1557B0]">WorkGraph</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              emitSaveAllBegin(["header", "links", "skills", "experience", "education"]);
              emitProfileSaveStart("all sections");
              emitSaveAllRequested();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#DADCE0] bg-[#E8F0FE] px-3 py-2 text-xs font-medium text-[#1557B0] transition hover:shadow-[0_1px_3px_rgba(0,0,0,0.10)]"
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
