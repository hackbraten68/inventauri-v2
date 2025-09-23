import Link from "next/link";
import { ArrowRight, BarChart3, Boxes, ChevronRight, ScanBarcode, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: Boxes,
    title: "Smart inventory",
    description: "Track stock movements, low inventory alerts, and product variants in real-time.",
  },
  {
    icon: BarChart3,
    title: "Sales intelligence",
    description: "Visualize sales velocity, channel performance, and top SKUs instantly.",
  },
  {
    icon: ScanBarcode,
    title: "Frictionless operations",
    description: "Barcode-ready, keyboard optimized workflows for busy shop floors.",
  },
];

export default function Home() {
  return (
    <div className="space-y-16">
      <section className="relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-black via-slate-900 to-slate-950 px-8 py-16 shadow-2xl">
        <div className="absolute -left-16 -top-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-20 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <Badge className="inline-flex items-center gap-2 border-primary/40 bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
              Inventory that actually feels modern
            </Badge>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              Operate your product business with clarity and confidence.
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Inventauri unifies inventory, sales, and analytics into a single command center.
              Forecast faster, fulfill smarter, and reclaim time for what matters.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Button size="lg" asChild>
                <Link href="/auth/signin" className="flex items-center gap-2">
                  Launch dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-border/50 bg-transparent" asChild>
                <Link href="/items" className="flex items-center gap-2">
                  Browse inventory
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <span>Realtime stock visibility</span>
              <span>Built-in Supabase auth</span>
              <span>Next.js App Router</span>
            </div>
          </div>

          <Card className="border border-border/40 bg-background/60 from-slate-900 via-slate-950 to-black">
            <CardContent className="space-y-6 p-6">
              <div>
                <p className="text-sm uppercase tracking-wide text-muted-foreground">Today</p>
                <h2 className="mt-2 text-3xl font-semibold">Operations snapshot</h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { label: "Fulfilled orders", value: "128", delta: "+18%" },
                  { label: "Stock movements", value: "342", delta: "–5%" },
                  { label: "Inventory value", value: "€87.4k", delta: "+2.3%" },
                  { label: "Low stock items", value: "12", delta: "+3" },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-border/40 bg-muted/20 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">{item.value}</p>
                    <p className="text-xs text-primary">{item.delta} vs last week</p>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
                Inventauri connects Supabase, Prisma, and modern UX foundations so you can ship product ops faster.
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {features.map(({ icon: Icon, title, description }) => (
          <Card key={title} className="border border-border/40 bg-muted/20">
            <CardContent className="space-y-4 p-6">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
