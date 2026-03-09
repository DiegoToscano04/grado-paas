import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "secondary" | "destructive" | "outline"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
    const variants = {
        default: "bg-blue-600 text-white border-transparent",
        secondary: "bg-slate-100 text-slate-900 border-transparent",
        destructive: "bg-red-500 text-white border-transparent",
        outline: "text-slate-950 border-slate-200"
    }
    return (
        <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2", variants[variant], className)} {...props} />
    )
}
export { Badge }