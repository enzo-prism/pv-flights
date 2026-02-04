import { BadgeCheck, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { poleApprovedAirlines } from "@/lib/poleAirlines";

export default function AirlinesPage() {
  return (
    <section className="space-y-8 animate-in fade-in-0 motion-reduce:animate-none">
      <div className="space-y-3">
        <Badge variant="outline" className="w-fit text-muted-foreground">
          <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
          Internal approval list
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight text-balance">
          Pole-Approved Airlines
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground text-pretty">
          Airlines confirmed to accept pole vault poles. The MVP currently
          includes a single verified carrier.
        </p>
      </div>

      <Separator />

      <div className="grid gap-4 md:grid-cols-2">
        {poleApprovedAirlines.map((airline) => (
          <Card key={airline.iataCode} className="shadow-sm">
            <CardHeader className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <CardTitle className="text-base text-pretty">
                    {airline.name}
                  </CardTitle>
                  <CardDescription className="text-xs uppercase tracking-[0.3em]">
                    {airline.iataCode}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-muted-foreground">
                  <BadgeCheck aria-hidden="true" className="h-3.5 w-3.5" />
                  Confirmed (internal research)
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>{airline.notes}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
