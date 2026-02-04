import { ShieldCheck } from "lucide-react";
import FlightSearch from "@/app/components/FlightSearch";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  return (
    <section className="space-y-8 animate-in fade-in-0">
      <div className="space-y-3">
        <Badge variant="outline" className="w-fit text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          Pole-approved only
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight">
          Search flights that accept pole vault poles
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          Enter your route and dates to see recommended itineraries filtered to
          the internal list of pole-approved airlines.
        </p>
      </div>
      <FlightSearch />
    </section>
  );
}
