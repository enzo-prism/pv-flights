"use client";

import { useState } from "react";
import {
  Info,
  ListFilter,
  Loader2,
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

type FormErrorField =
  | "route"
  | "departDate"
  | "returnDate"
  | "passengers"
  | "infants";

type FormError = {
  field: FormErrorField;
  message: string;
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

function formatPrice(total: string, currency: string) {
  const value = Number.parseFloat(total);
  if (Number.isNaN(value)) {
    return `${currency} ${total}`;
  }
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${total}`;
  }
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
  const [formError, setFormError] = useState<FormError | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [sourceMessage, setSourceMessage] = useState<string | null>(null);
  const routeError = formError?.field === "route" ? formError.message : null;
  const departError = formError?.field === "departDate" ? formError.message : null;
  const returnError = formError?.field === "returnDate" ? formError.message : null;
  const passengersError =
    formError?.field === "passengers" ? formError.message : null;
  const infantsError = formError?.field === "infants" ? formError.message : null;
  const passengersErrorId = passengersError ? "passengers-error" : undefined;
  const infantsErrorId = infantsError ? "infants-error" : undefined;
  const infantsDescribedBy = [passengersErrorId, infantsErrorId]
    .filter(Boolean)
    .join(" ") || undefined;

  const focusField = (fieldId: string) => {
    requestAnimationFrame(() => {
      const element = document.getElementById(fieldId);
      if (element instanceof HTMLElement) {
        element.focus();
      }
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const originCode = origin.trim().toUpperCase();
    const destinationCode = destination.trim().toUpperCase();

    if (!iataPattern.test(originCode) || !iataPattern.test(destinationCode)) {
      setFormError({
        field: "route",
        message: "Please enter valid 3-letter IATA codes (e.g., SFO, MNL).",
      });
      setRequestError(null);
      focusField("origin");
      return;
    }

    if (!departDate) {
      setFormError({ field: "departDate", message: "Please choose a departure date." });
      setRequestError(null);
      focusField("departDate");
      return;
    }

    if (returnDate && returnDate < departDate) {
      setFormError({
        field: "returnDate",
        message: "Return date cannot be before the departure date.",
      });
      setRequestError(null);
      focusField("returnDate");
      return;
    }

    if (adults < 1 || children < 0 || infants < 0) {
      setFormError({
        field: "passengers",
        message: "Passenger counts must be non-negative, with at least 1 adult.",
      });
      setRequestError(null);
      focusField("adults");
      return;
    }

    if (infants > adults) {
      setFormError({
        field: "infants",
        message: "Infants cannot exceed the number of adults.",
      });
      setRequestError(null);
      focusField("infants");
      return;
    }

    setFormError(null);
    setRequestError(null);
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
        setRequestError(payload.error ?? "Something went wrong. Please try again.");
        setFormError(null);
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
      setRequestError("Unable to load flights. Please try again.");
      setFormError(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit}>
        <Card className="shadow-sm">
          <CardHeader className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Search Pole-Approved Flights</CardTitle>
                <CardDescription className="text-pretty">
                  Live offers filtered to approved airlines only.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-muted-foreground">
                <Info aria-hidden="true" className="h-3.5 w-3.5" />
                IATA codes required
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <AirportCombobox
                id="origin"
                label="From"
                placeholder="Select origin airport (e.g., SFO)…"
                value={origin}
                onValueChange={(code) => setOrigin(code.toUpperCase())}
                options={majorAirports}
                errorMessage={routeError}
              />
              <AirportCombobox
                id="destination"
                label="To"
                placeholder="Select destination airport (e.g., MNL)…"
                value={destination}
                onValueChange={(code) => setDestination(code.toUpperCase())}
                options={majorAirports}
                errorMessage={routeError}
              />
              <div className="space-y-2">
                <Label htmlFor="departDate">Depart date</Label>
                <Input
                  id="departDate"
                  name="departDate"
                  type="date"
                  autoComplete="off"
                  value={departDate}
                  onChange={(event) => setDepartDate(event.target.value)}
                  className="h-11 sm:h-9"
                  aria-invalid={Boolean(departError)}
                  aria-describedby={departError ? "departDate-error" : undefined}
                />
                {departError ? (
                  <p
                    id="departDate-error"
                    role="status"
                    aria-live="polite"
                    className="text-xs text-destructive"
                  >
                    {departError}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="returnDate">Return date (optional)</Label>
                <Input
                  id="returnDate"
                  name="returnDate"
                  type="date"
                  autoComplete="off"
                  value={returnDate}
                  onChange={(event) => setReturnDate(event.target.value)}
                  className="h-11 sm:h-9"
                  aria-invalid={Boolean(returnError)}
                  aria-describedby={returnError ? "returnDate-error" : undefined}
                />
                {returnError ? (
                  <p
                    id="returnDate-error"
                    role="status"
                    aria-live="polite"
                    className="text-xs text-destructive"
                  >
                    {returnError}
                  </p>
                ) : null}
              </div>
            </div>
            <Separator />
            <fieldset className="space-y-2">
              <legend className="sr-only">Passengers</legend>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="adults">Adults</Label>
                  <Input
                    id="adults"
                    name="adults"
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
                    autoComplete="off"
                    className="h-11 sm:h-9"
                    aria-invalid={Boolean(passengersError)}
                    aria-describedby={passengersErrorId}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="children">Children</Label>
                  <Input
                    id="children"
                    name="children"
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
                    autoComplete="off"
                    className="h-11 sm:h-9"
                    aria-invalid={Boolean(passengersError)}
                    aria-describedby={passengersErrorId}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="infants">Infants</Label>
                  <Input
                    id="infants"
                    name="infants"
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
                    autoComplete="off"
                    className="h-11 sm:h-9"
                    aria-invalid={Boolean(infantsError || passengersError)}
                    aria-describedby={infantsDescribedBy}
                  />
                  {infantsError ? (
                    <p
                      id={infantsErrorId}
                      role="status"
                      aria-live="polite"
                      className="text-xs text-destructive"
                    >
                      {infantsError}
                    </p>
                  ) : null}
                </div>
              </div>
              {passengersError ? (
                <p
                  id={passengersErrorId}
                  role="status"
                  aria-live="polite"
                  className="text-xs text-destructive"
                >
                  {passengersError}
                </p>
              ) : null}
            </fieldset>
            {requestError ? (
              <Alert variant="destructive">
                <AlertTitle>Unable to Search</AlertTitle>
                <AlertDescription>{requestError}</AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-3">
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Button
                type="submit"
                size="lg"
                className="h-11 w-full sm:w-auto"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                    Searching…
                  </>
                ) : (
                  "Search Flights"
                )}
              </Button>
              <Badge variant="outline" className="text-muted-foreground">
                <Users aria-hidden="true" className="h-3.5 w-3.5" />
                Passengers: {formatPassengerLabel({ adults, children, infants })}
              </Badge>
              <Badge variant="outline" className="text-muted-foreground">
                <ListFilter aria-hidden="true" className="h-3.5 w-3.5" />
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-balance">
              Recommended Flights
            </h2>
            <p className="text-sm text-muted-foreground text-pretty">
              Sorted by lowest price, then shortest duration when available.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {hasSearched ? (
              <Badge variant="outline" className="text-muted-foreground">
                <Users aria-hidden="true" className="h-3.5 w-3.5" />
                {formatPassengerLabel(searchCounts)}
              </Badge>
            ) : null}
            {sourceMessage ? (
              <Badge
                variant="secondary"
                className="max-w-full break-words text-center text-muted-foreground"
                role="status"
                aria-live="polite"
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

        {!isLoading && hasSearched && results.length === 0 && !requestError ? (
          <Alert>
          <AlertTitle>No Pole-Approved Flights Found</AlertTitle>
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
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <CardTitle className="text-base text-pretty">
                      {result.airlineName}
                    </CardTitle>
                    <CardDescription className="text-xs uppercase tracking-[0.3em]">
                      {result.carrierCode}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-start sm:items-end sm:text-right">
                    <Badge
                      variant="secondary"
                      className="text-sm text-foreground tabular-nums"
                    >
                      {formatPrice(result.price.total, result.price.currency)}
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
                  <Badge
                    variant="outline"
                    title={result.segmentsSummary}
                    className="max-w-full break-words whitespace-normal text-left leading-snug"
                  >
                    {result.segmentsSummary}
                  </Badge>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="grid gap-2 text-sm">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <PlaneTakeoff aria-hidden="true" className="h-4 w-4" />
                    Depart
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatDateTime(result.departAt)}
                  </span>
                </div>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <PlaneLanding aria-hidden="true" className="h-4 w-4" />
                    Arrive
                  </span>
                  <span className="font-medium tabular-nums">
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
