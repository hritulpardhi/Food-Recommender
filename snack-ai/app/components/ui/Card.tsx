"use client";

import React from "react";
import cn from "../../../lib/cn";

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("terminal-card relative z-10", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ title }: { title: React.ReactNode }) {
  return (
    <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
      <h3 className="ascii-logo">{title}</h3>
    </div>
  );
}
