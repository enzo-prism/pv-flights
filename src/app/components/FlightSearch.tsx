"use client";

import { useState } from "react";
import {
  Info,
  ListFilter,
  PlaneLanding,
  PlaneTakeoff,
  Users,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import AirportCombobox from "@/app/components/AirportCombobox";
import { majorAirports } from "@/lib/airports";

type FlightResult = {
  id: string;
  carrierCode: string;
  airlineName: string;
  price: {
    total: string;
    currency: string;
  };
  departAt: string;
  arriveAt: string;
  stops: number;
  segmentsSummary: string;
  durationMinutes?: number;
};

type FlightResponse = {
  data: FlightResult[];
  source: "amadeus" | "mock";
  message?: string;
};

const iataPattern = /^[A-Z]{3}$/;

function formatPassengerLabel(counts: {
  adults: number;
  children: number;
  infants: number;
}) {
  const parts: string[] = [];
  parts.push(`${counts.adults} Adult${counts.adults === 1 ? "" : "s"}`);
  if (counts.children > 0) {
    parts.push(
      `${counts.children} ${counts.children === 1 ? "Child" : "Children"}`,
    );
  }
  if (counts.infants > 0) {
    parts.push(`${counts.infants} Infant${counts.infants === 1 ? "" : "s"}`);
  }
  return parts.join(", ");
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatStops(stops: number) {
  if (stops === 0) return "Nonstop";
  if (stops === 1) return "1 stop";
  return `${stops} stops`;
}

export default function FlightSearch() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departDate, setDepartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [searchCounts, setSearchCounts] = useState({
    adults: 1,
    children: 0,
    infants: 0,
  });
  const [results, setResults] = useState<FlightResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [sourceMessage, setSourceMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const originCode = origin.trim().toUpperCase();
    const destinationCode = destination.trim().toUpperCase();

    if (!iataPattern.test(originCode) || !iataPattern.test(destinationCode)) {
      setError("Please enter valid 3-letter IATA codes (e.g., SFO, MNL).");
      return;
    }

    if (!departDate) {
      setError("Please choose a departure date.");
      return;
    }

    if (returnDate && returnDate < departDate) {
      setError("Return date cannot be before the departure date.");
      return;
    }

    if (adults < 1 || children < 0 || infants < 0) {
      setError("Passenger counts must be non-negative, with at least 1 adult.");
      return;
    }

    if (infants > adults) {
      setError("Infants cannot exceed the number of adults.");
      return;
    }

    setError(null);
    setIsLoading(true);
    setHasSearched(true);
    setResults([]);
    setSourceMessage(null);
    setSearchCounts({ adults, children, infants });

    const params = new URLSearchParams({
      origin: originCode,
      destination: destinationCode,
      departDate,
      adults: String(adults),
    });

    if (returnDate) {
      params.set("returnDate", returnDate);
    }

    if (children > 0) {
      params.set("children", String(children));
    }

    if (infants > 0) {
      params.set("infants", String(infants));
    }

    try {
      const response = await fetch(`/api/flights?${params.toString()}`);
      const payload = (await response.json()) as FlightResponse & {
        error?: string;
      };

      if (!response.ok) {
        setError(payload.error ?? "Something went wrong.");
        setIsLoading(false);
        return;
      }

      setResults(payload.data ?? []);
      if (payload.source === "mock") {
        setSourceMessage(payload.message ?? "Mock data (missing API keys).");
      } else if (payload.message) {
        setSourceMessage(payload.message);
      }
    } catch {
      setError("Unable to load flights. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit}>
        <Card className="shadow-sm">
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Search pole-approved flights</CardTitle>
                <CardDescription>
                  Live offers filtered to approved airlines only.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-muted-foreground">
                <Info className="h-3.5 w-3.5" />
                IATA codes required
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-4">
              <AirportCombobox
                id="origin"
                label="From"
                placeholder="Select origin airport"
                value={origin}
                onValueChange={(code) => setOrigin(code.toUpperCase())}
                options={majorAirports}
              />
              <AirportCombobox
                id="destination"
                label="To"
                placeholder="Select destination airport"
                value={destination}
                onValueChange={(code) => setDestination(code.toUpperCase())}
                options={majorAirports}
              />
              <div className="space-y-2">
                <Label htmlFor="departDate">Depart date</Label>
                <Input
                  id="departDate"
                  type="date"
                  value={departDate}
                  onChange={(event) => setDepartDate(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="returnDate">Return date (optional)</Label>
                <Input
                  id="returnDate"
                  type="date"
                  value={returnDate}
                  onChange={(event) => setReturnDate(event.target.value)}
                />
              </div>
            </div>
            <Separator />
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="adults">Adults</Label>
                <Input
                  id="adults"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={9}
                  value={adults}
                  onChange={(event) => {
                    const value = Number.parseInt(event.target.value, 10);
                    if (Number.isNaN(value)) return;
                    setAdults(Math.min(Math.max(value, 1), 9));
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="children">Children</Label>
                <Input
                  id="children"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={9}
                  value={children}
                  onChange={(event) => {
                    const value = Number.parseInt(event.target.value, 10);
                    if (Number.isNaN(value)) return;
                    setChildren(Math.min(Math.max(value, 0), 9));
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="infants">Infants</Label>
                <Input
                  id="infants"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={9}
                  value={infants}
                  onChange={(event) => {
                    const value = Number.parseInt(event.target.value, 10);
                    if (Number.isNaN(value)) return;
                    setInfants(Math.min(Math.max(value, 0), 9));
                  }}
                />
              </div>
            </div>
            {error ? (
              <Alert variant="destructive">
                <AlertTitle>Unable to search</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" variant="outline" disabled={isLoading}>
                {isLoading ? "Searching..." : "Search flights"}
              </Button>
              <Badge variant="outline" className="text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                Passengers: {formatPassengerLabel({ adults, children, infants })}
              </Badge>
              <Badge variant="outline" className="text-muted-foreground">
                <ListFilter className="h-3.5 w-3.5" />
                Max results: 10
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Final acceptance of sports equipment can vary by route and
              aircraft; verify directly with the airline.
            </p>
          </CardFooter>
        </Card>
      </form>

      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Recommended flights
            </h2>
            <p className="text-sm text-muted-foreground">
              Sorted by lowest price, then shortest duration when available.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {hasSearched ? (
              <Badge variant="outline" className="text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                {formatPassengerLabel(searchCounts)}
              </Badge>
            ) : null}
            {sourceMessage ? (
              <Badge
                variant="secondary"
                className="max-w-full text-center text-muted-foreground"
              >
                {sourceMessage}
              </Badge>
            ) : null}
          </div>
        </div>
        <Separator />

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <Card key={`loading-${index}`}>
                <CardHeader className="space-y-3">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-16" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}

        {!isLoading && hasSearched && results.length === 0 && !error ? (
          <Alert>
            <AlertTitle>No pole-approved flights found</AlertTitle>
            <AlertDescription>
              Try adjusting your dates or route. Results are limited to the
              approved airline list.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          {results.map((result) => (
            <Card key={result.id} className="shadow-sm">
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-base">
                      {result.airlineName}
                    </CardTitle>
                    <CardDescription className="text-xs uppercase tracking-[0.3em]">
                      {result.carrierCode}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="text-sm text-foreground">
                      {result.price.currency} {result.price.total}
                    </Badge>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Total for{" "}
                      {searchCounts.adults +
                        searchCounts.children +
                        searchCounts.infants}{" "}
                      travelers
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{formatStops(result.stops)}</Badge>
                  <Badge variant="outline" className="max-w-full truncate">
                    {result.segmentsSummary}
                  </Badge>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="grid gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <PlaneTakeoff className="h-4 w-4" />
                    Depart
                  </span>
                  <span className="font-medium">
                    {formatDateTime(result.departAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <PlaneLanding className="h-4 w-4" />
                    Arrive
                  </span>
                  <span className="font-medium">
                    {formatDateTime(result.arriveAt)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
