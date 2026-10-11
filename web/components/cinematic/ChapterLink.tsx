'use client';
import type { ReactNode } from 'react';
import { cinematicBus } from '../../lib/cinematic/bus';
export default function ChapterLink({ children, className }: { children: ReactNode; className?: string }) {
  return <a href="#chapter-1" className={className} onClick={e => { if (cinematicBus.scrollToChapter(0)) e.preventDefault(); }}>{children}</a>;
}
