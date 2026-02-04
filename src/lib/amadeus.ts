export const AMADEUS_HOST =
  process.env.AMADEUS_HOST ?? "https://test.api.amadeus.com";

type TokenCache = {
  accessToken: string;
  expiresAt: number;
};

let tokenCache: TokenCache | null = null;

export type FlightOffersSearchParams = {
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string;
  adults?: number;
  children?: number;
  infants?: number;
  max?: number;
  currencyCode?: string;
  includedAirlineCodes: string[];
};

export type AmadeusFlightOfferResponse = {
  data: unknown[];
  dictionaries?: {
    carriers?: Record<string, string>;
  };
};

function withExpiryBuffer(expiresInSeconds: number) {
  const bufferSeconds = 60;
  const safeSeconds = Math.max(expiresInSeconds - bufferSeconds, 0);
  return Date.now() + safeSeconds * 1000;
}

async function getAccessToken(clientId: string, clientSecret: string) {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.accessToken;
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch(`${AMADEUS_HOST}/v1/security/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message =
      (errorBody as { error_description?: string } | null)?.error_description ??
      "Failed to fetch Amadeus access token.";
    const error = new Error(message);
    (error as Error & { status?: number; details?: unknown }).status =
      response.status;
    (error as Error & { status?: number; details?: unknown }).details =
      errorBody;
    throw error;
  }

  const payload = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };

  tokenCache = {
    accessToken: payload.access_token,
    expiresAt: withExpiryBuffer(payload.expires_in),
  };

  return payload.access_token;
}

export async function fetchFlightOffers(
  params: FlightOffersSearchParams,
  clientId: string,
  clientSecret: string,
): Promise<AmadeusFlightOfferResponse> {
  const accessToken = await getAccessToken(clientId, clientSecret);

  const searchParams = new URLSearchParams({
    originLocationCode: params.origin,
    destinationLocationCode: params.destination,
    departureDate: params.departDate,
    adults: String(params.adults ?? 1),
    max: String(params.max ?? 10),
    currencyCode: params.currencyCode ?? "USD",
    includedAirlineCodes: params.includedAirlineCodes.join(","),
  });

  if (params.children && params.children > 0) {
    searchParams.set("children", String(params.children));
  }

  if (params.infants && params.infants > 0) {
    searchParams.set("infants", String(params.infants));
  }

  if (params.returnDate) {
    searchParams.set("returnDate", params.returnDate);
  }

  const response = await fetch(
    `${AMADEUS_HOST}/v2/shopping/flight-offers?${searchParams.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message =
      (errorBody as { errors?: { detail?: string }[] } | null)?.errors?.[0]
        ?.detail ?? "Amadeus Flight Offers request failed.";
    const error = new Error(message);
    (error as Error & { status?: number; details?: unknown }).status =
      response.status;
    (error as Error & { status?: number; details?: unknown }).details =
      errorBody;
    throw error;
  }

  return (await response.json()) as AmadeusFlightOfferResponse;
}
