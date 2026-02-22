"use client";

import React from "react";

export default function FloatingShapes({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden scanlines ${className}`}>
      <div style={{ position: 'absolute', left: 20, top: 20 }} className="ascii-logo">_SNACK.AI_</div>
    </div>
  );
}
