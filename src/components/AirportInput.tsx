"use client";

import { useId, useMemo, useState } from "react";
import { airportByCode, airportLabel, searchAirports } from "@/lib/airports";
import { inputClass } from "@/components/form-ui";

type Props = {
  id: string;
  value: string; // IATA code, or "" if nothing chosen
  onChange: (code: string) => void;
  error?: string;
};

export default function AirportInput({ id, value, onChange, error }: Props) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const selected = value ? airportByCode(value) : undefined;
  const results = useMemo(() => searchAirports(query), [query]);

  // While typing show what they type. Otherwise show the chosen airport.
  const text = open ? query : selected ? airportLabel(selected) : "";

  function choose(code: string) {
    onChange(code);
    setOpen(false);
    setQuery("");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && open && results[active]) {
      e.preventDefault(); // do not submit the whole form
      choose(results[active].code);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <input
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-invalid={error ? true : undefined}
        autoComplete="off"
        placeholder={selected ? airportLabel(selected) : "Search city, airport or code"}
        value={text}
        onFocus={() => {
          setOpen(true);
          setQuery("");
          setActive(0);
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        className={inputClass(error)}
      />

      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1.5 max-h-64 w-full overflow-auto rounded-md border border-line bg-white py-1 shadow-[0_8px_24px_rgba(15,27,45,0.12)]"
        >
          {results.length === 0 && (
            <li className="px-3 py-3 text-sm text-muted">
              No airports found. Try the city, the airport name or the 3-letter code.
            </li>
          )}
          {results.map((a, i) => (
            <li
              key={a.code}
              role="option"
              aria-selected={i === active}
              // onMouseDown (not onClick) so it fires before the input loses focus
              onMouseDown={(e) => {
                e.preventDefault();
                choose(a.code);
              }}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-baseline gap-3 px-3 py-2 text-sm ${i === active ? "bg-accent-soft" : ""}`}
            >
              <span className="w-9 shrink-0 font-mono text-[13px] font-medium">{a.code}</span>
              <span className="min-w-0">
                <span className="block truncate">{a.name}</span>
                <span className="block text-xs text-muted">{a.city}, {a.country}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
