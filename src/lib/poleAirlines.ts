export type PoleApprovedAirline = {
  name: string;
  iataCode: string;
  status: "confirmed";
  notes: string;
};

export const poleApprovedAirlines: PoleApprovedAirline[] = [
  {
    name: "Philippine Airlines",
    iataCode: "PR",
    status: "confirmed",
    notes: "MVP: only airline in the approved list",
  },
];

export const poleApprovedAirlineCodes = poleApprovedAirlines.map((airline) =>
  airline.iataCode.toUpperCase(),
);

export const poleApprovedAirlinesByCode = new Map(
  poleApprovedAirlines.map((airline) => [airline.iataCode, airline]),
);
