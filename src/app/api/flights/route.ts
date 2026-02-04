import { NextResponse } from "next/server";
import {
  poleApprovedAirlineCodes,
  poleApprovedAirlinesByCode,
} from "@/lib/poleAirlines";
import { fetchFlightOffers } from "@/lib/amadeus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type NormalizedFlight = {
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

type AmadeusSegment = {
  carrierCode?: string;
  number?: string;
  departure?: { at?: string };
  arrival?: { at?: string };
};

type AmadeusItinerary = {
  duration?: string;
  segments?: AmadeusSegment[];
};

type AmadeusOffer = {
  id?: string;
  itineraries?: AmadeusItinerary[];
  price?: { grandTotal?: string; currency?: string };
  validatingAirlineCodes?: string[];
};

const iataPattern = /^[A-Z]{3}$/;

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime());
}

function parseCount(value: string | null, fallback: number) {
  if (value === null || value.trim() === "") {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return parsed;
}

function parseDurationMinutes(duration?: string) {
  if (!duration) return null;
  const match =
    /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(
      duration,
    );
  if (!match) return null;
  const days = Number.parseInt(match[1] ?? "0", 10);
  const hours = Number.parseInt(match[2] ?? "0", 10);
  const minutes = Number.parseInt(match[3] ?? "0", 10);
  const seconds = Number.parseInt(match[4] ?? "0", 10);
  return days * 24 * 60 + hours * 60 + minutes + Math.round(seconds / 60);
}

function computeDurationMinutes(start?: string, end?: string) {
  if (!start || !end) return null;
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return null;
  }
  const diff = endDate.getTime() - startDate.getTime();
  if (diff <= 0) return null;
  return Math.round(diff / 60000);
}

function normalizeOffers(
  offers: AmadeusOffer[],
  carrierNames: Record<string, string> | undefined,
  allowedCarrierCodes: Set<string>,
) {
  const normalized = offers
    .map((offer) => {
      const itinerary = offer.itineraries?.[0];
      const segments = itinerary?.segments ?? [];
      if (!itinerary || segments.length === 0) {
        return null;
      }

      const firstSegment = segments[0];
      const lastSegment = segments[segments.length - 1];
      const carrierCode =
        firstSegment.carrierCode ?? offer.validatingAirlineCodes?.[0];

      if (!carrierCode || !allowedCarrierCodes.has(carrierCode)) {
        return null;
      }

      const departAt = firstSegment.departure?.at;
      const arriveAt = lastSegment.arrival?.at;
      if (!departAt || !arriveAt) {
        return null;
      }

      const priceTotal = offer.price?.grandTotal ?? "0.00";
      const priceCurrency = offer.price?.currency ?? "USD";

      const segmentsSummary = segments
        .map((segment) => {
          const code = segment.carrierCode ?? carrierCode;
          const number = segment.number ? ` ${segment.number}` : "";
          return `${code}${number}`;
        })
        .join(" -> ");

      const durationMinutes =
        parseDurationMinutes(itinerary.duration) ??
        computeDurationMinutes(departAt, arriveAt) ??
        undefined;

      const sortPrice = Number.parseFloat(priceTotal);
      const sortDuration = durationMinutes ?? Number.POSITIVE_INFINITY;

      const airlineName =
        carrierNames?.[carrierCode] ??
        poleApprovedAirlinesByCode.get(carrierCode)?.name ??
        carrierCode;

      const normalizedOffer: NormalizedFlight = {
        id: offer.id ?? `${carrierCode}-${departAt}`,
        carrierCode,
        airlineName,
        price: {
          total: priceTotal,
          currency: priceCurrency,
        },
        departAt,
        arriveAt,
        stops: Math.max(segments.length - 1, 0),
        segmentsSummary,
        ...(durationMinutes ? { durationMinutes } : {}),
      };

      return {
        normalized: normalizedOffer,
        sortPrice: Number.isFinite(sortPrice)
          ? sortPrice
          : Number.POSITIVE_INFINITY,
        sortDuration,
      };
    })
    .filter(
      (item): item is { normalized: NormalizedFlight; sortPrice: number; sortDuration: number } =>
        Boolean(item),
    );

  normalized.sort((a, b) => {
    if (a.sortPrice !== b.sortPrice) {
      return a.sortPrice - b.sortPrice;
    }
    return a.sortDuration - b.sortDuration;
  });

  return normalized.map((item) => item.normalized);
}

function buildMockResults(departDate: string): NormalizedFlight[] {
  const carrierCode = poleApprovedAirlineCodes[0] ?? "PR";
  const airlineName =
    poleApprovedAirlinesByCode.get(carrierCode)?.name ?? "Philippine Airlines";
  const baseDate = departDate || "2026-02-10";

  return [
    {
      id: "mock-1",
      carrierCode,
      airlineName,
      price: { total: "682.40", currency: "USD" },
      departAt: `${baseDate}T08:10:00`,
      arriveAt: `${baseDate}T22:05:00`,
      stops: 0,
      segmentsSummary: `${carrierCode} 103`,
      durationMinutes: 835,
    },
    {
      id: "mock-2",
      carrierCode,
      airlineName,
      price: { total: "745.10", currency: "USD" },
      departAt: `${baseDate}T11:30:00`,
      arriveAt: `${baseDate}T23:45:00`,
      stops: 1,
      segmentsSummary: `${carrierCode} 205 -> ${carrierCode} 412`,
      durationMinutes: 855,
    },
  ];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = searchParams.get("origin")?.toUpperCase() ?? "";
  const destination = searchParams.get("destination")?.toUpperCase() ?? "";
  const departDate = searchParams.get("departDate") ?? "";
  const returnDateParam = searchParams.get("returnDate");
  const returnDate =
    returnDateParam && returnDateParam.length > 0
      ? returnDateParam
      : undefined;
  const adults = parseCount(searchParams.get("adults"), 1);
  const children = parseCount(searchParams.get("children"), 0);
  const infants = parseCount(searchParams.get("infants"), 0);

  if (!iataPattern.test(origin) || !iataPattern.test(destination)) {
    return NextResponse.json(
      { error: "Invalid origin or destination IATA code." },
      { status: 400 },
    );
  }

  if (origin === destination) {
    return NextResponse.json(
      { error: "Origin and destination must be different." },
      { status: 400 },
    );
  }

  if (!isValidDate(departDate)) {
    return NextResponse.json(
      { error: "Invalid departure date. Use YYYY-MM-DD." },
      { status: 400 },
    );
  }

  if (returnDate && !isValidDate(returnDate)) {
    return NextResponse.json(
      { error: "Invalid return date. Use YYYY-MM-DD." },
      { status: 400 },
    );
  }

  if (returnDate && returnDate < departDate) {
    return NextResponse.json(
      { error: "Return date cannot be before departure date." },
      { status: 400 },
    );
  }

  if (adults === null || children === null || infants === null) {
    return NextResponse.json(
      { error: "Invalid passenger counts. Use integers only." },
      { status: 400 },
    );
  }

  if (adults < 1 || children < 0 || infants < 0) {
    return NextResponse.json(
      { error: "Passenger counts must be non-negative, with at least 1 adult." },
      { status: 400 },
    );
  }

  if (infants > adults) {
    return NextResponse.json(
      { error: "Infants cannot exceed the number of adults." },
      { status: 400 },
    );
  }

  const clientId = process.env.AMADEUS_CLIENT_ID;
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET;

  const allowedCarrierCodes = new Set(
    poleApprovedAirlineCodes.map((code) => code.toUpperCase()),
  );

  if (!clientId || !clientSecret) {
    return NextResponse.json({
      source: "mock",
      message: "Mock data (missing API keys)",
      data: buildMockResults(departDate),
    });
  }

  try {
    const response = await fetchFlightOffers(
      {
        origin,
        destination,
        departDate,
        returnDate,
        adults,
        children,
        infants,
        includedAirlineCodes: [...allowedCarrierCodes],
      },
      clientId,
      clientSecret,
    );

    const offers = (response.data ?? []) as AmadeusOffer[];
    const normalized = normalizeOffers(
      offers,
      response.dictionaries?.carriers,
      allowedCarrierCodes,
    );

    return NextResponse.json({
      source: "amadeus",
      data: normalized,
    });
  } catch (error) {
    const message =
      (error as Error).message ??
      "Amadeus request failed. Check API credentials.";

    return NextResponse.json(
      {
        error: `${message} (Hint: verify AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET)`,
      },
      { status: 502 },
    );
  }
}
