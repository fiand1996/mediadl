import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  "backdrop-blur-xl transition-all border shadow-2xl",
  {
    variants: {
      variant: {
        default: "bg-white/[0.04] border-white/10 rounded-2xl",
        glass: "bg-slate-900/80 border-white/10 rounded-2xl",
        solid: "bg-slate-900 border-slate-800 rounded-2xl",
      },
      padding: {
        default: "p-5",
        lg: "p-8",
        sm: "p-3",
      }
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export function Card({ className, variant, padding, ...props }: CardProps) {
  return (
    <div className={cn(cardVariants({ variant, padding }), className)} {...props} />
  );
}
