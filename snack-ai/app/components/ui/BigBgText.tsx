"use client";

import React from "react";

export default function BigBgText({ text = 'SNACK.AI' }: { text?: string }) {
  return (
    <div aria-hidden="true" style={{ position: 'absolute', left: '50%', top: '8%', transform: 'translateX(-50%)', opacity: 0.06, pointerEvents: 'none' }} className="ascii-logo text-[6rem]">{text}</div>
  );
}
