import { ArrowRight } from "lucide-react";
import { LinkButton } from "@/components/ui/link-button";

export function SellerCTA() {
  return (
    <section className="py-16 bg-[#1A1A1A] text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          <div>
            <p className="text-[#C8956C] text-sm font-medium mb-2 uppercase tracking-widest">
              For brands
            </p>
            <h2 className="font-heading text-3xl lg:text-4xl font-bold leading-tight text-balance">
              Reach international retailers.{" "}
              <span className="text-[#C8956C] italic">No sales team needed.</span>
            </h2>
            <p className="mt-3 text-[#6B6056] max-w-lg leading-relaxed">
              List your products, create a shareable wholesale catalogue link, and
              send it to your own customers — they order at 0% commission. Platform
              buyers pay the standard rate only.
            </p>

            <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                "First listing in under 15 minutes",
                "0% commission via your share link",
                "INR payouts via PayPal or bank transfer",
                "Achievement badges build buyer trust",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-[#E8E0D8]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#C8956C] shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col gap-3 min-w-[220px]">
            <LinkButton href="/signup?role=brand" size="lg" variant="default" className="w-full justify-center">
              Apply as a brand
              <ArrowRight className="h-4 w-4" />
            </LinkButton>
            <LinkButton href="/about" size="lg" variant="dark" className="w-full justify-center">
              Learn more
            </LinkButton>
          </div>
        </div>
      </div>
    </section>
  );
}
