"use client";

import React from "react";
import cn from "../../../lib/cn";

type Variant = "default" | "ghost";

export default function Button({ children, className = "", variant = "default", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const base = "btn-terminal font-bold"
  const variantClass = {
    default: "",
    ghost: ""
  }[variant]

  return (
    <button className={cn(base, variantClass, className)} {...props}>
      [ {children} ]
    </button>
  )
}
