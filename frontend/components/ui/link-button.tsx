import Link from "next/link";
import { type VariantProps, cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const linkButtonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors whitespace-nowrap select-none",
  {
    variants: {
      variant: {
        default:  "bg-[#1A1A1A] text-white hover:bg-[#8B7055]",
        outline:  "border border-[#E5E1D8] bg-white text-[#1A1A1A] hover:bg-[#F5F0E8] hover:border-[#A68B67]",
        ghost:    "text-[#444748] hover:text-[#1A1A1A] hover:bg-[#F5F0E8]",
        dark:     "border border-[#2D2D2D] text-[#E5E1D8] hover:bg-[#2D2D2D] hover:border-[#A68B67]",
        copper:   "bg-[#1A1A1A] text-white hover:bg-[#8B7055]",
      },
      size: {
        sm:      "h-8  px-3  text-xs",
        default: "h-9  px-4  text-sm",
        lg:      "h-12 px-7  text-sm",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

interface Props extends VariantProps<typeof linkButtonVariants> {
  href: string;
  children: React.ReactNode;
  className?: string;
  external?: boolean;
  onClick?: () => void;
}

export function LinkButton({ href, children, variant, size, className, external, onClick }: Props) {
  const classes = cn(linkButtonVariants({ variant, size }), className);

  if (external) {
    return (
      <a href={href} className={classes} target="_blank" rel="noopener noreferrer" onClick={onClick}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes} onClick={onClick}>
      {children}
    </Link>
  );
}