"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { AirportOption } from "@/lib/airports";
import { formatAirportLabel } from "@/lib/airports";

const iataPattern = /^[A-Z]{3}$/;

type AirportComboboxProps = {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onValueChange: (value: string) => void;
  options: AirportOption[];
  errorMessage?: string | null;
};

export default function AirportCombobox({
  id,
  label,
  placeholder,
  value,
  onValueChange,
  options,
  errorMessage,
}: AirportComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = options.find((option) => option.iata === value) ?? null;
  const normalizedQuery = query.trim().toUpperCase();
  const optionCodes = useMemo(
    () => new Set(options.map((option) => option.iata)),
    [options],
  );
  const canUseCustom =
    iataPattern.test(normalizedQuery) && !optionCodes.has(normalizedQuery);
  const errorId = errorMessage ? `${id}-error` : undefined;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-invalid={Boolean(errorMessage)}
            aria-describedby={errorId}
            className="h-11 w-full justify-between text-left font-normal sm:h-9"
          >
            <span
              className="min-w-0 truncate"
              title={selected ? formatAirportLabel(selected) : placeholder}
            >
              {selected ? formatAirportLabel(selected) : placeholder}
            </span>
            <ChevronsUpDown
              aria-hidden="true"
              className="ml-2 h-4 w-4 shrink-0 text-muted-foreground"
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[var(--radix-popover-trigger-width)] p-0"
        >
          <Command>
            <CommandInput
              aria-label={`${label} airport search`}
              autoComplete="off"
              enterKeyHint="search"
              name={`${id}-search`}
              placeholder="Search airports (e.g., SFO)…"
              spellCheck={false}
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              <CommandEmpty>No airport found.</CommandEmpty>
              <CommandGroup>
                {canUseCustom ? (
                  <CommandItem
                    value={normalizedQuery}
                    onSelect={() => {
                      onValueChange(normalizedQuery);
                      setOpen(false);
                    }}
                  >
                    Use “{normalizedQuery}”
                  </CommandItem>
                ) : null}
                {options.map((option) => (
                  <CommandItem
                    key={option.iata}
                    value={`${option.iata} ${option.name} ${option.city} ${option.country}`}
                    onSelect={() => {
                      onValueChange(option.iata);
                      setOpen(false);
                    }}
                  >
                    <Check
                      aria-hidden="true"
                      className={cn(
                        "mr-2 h-4 w-4",
                        option.iata === value ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {option.iata} - {option.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {option.city}, {option.country}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {errorMessage ? (
        <p
          id={errorId}
          role="status"
          aria-live="polite"
          className="text-xs text-destructive"
        >
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
