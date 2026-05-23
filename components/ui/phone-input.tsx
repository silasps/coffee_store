"use client";

import { useState, useEffect } from "react";

type Country = { code: string; dial: string; flag: string; name: string };

export const PHONE_COUNTRIES: Country[] = [
  { code: "BR", dial: "+55",  flag: "🇧🇷", name: "Brasil" },
  { code: "PT", dial: "+351", flag: "🇵🇹", name: "Portugal" },
  { code: "US", dial: "+1",   flag: "🇺🇸", name: "EUA" },
  { code: "AR", dial: "+54",  flag: "🇦🇷", name: "Argentina" },
  { code: "CL", dial: "+56",  flag: "🇨🇱", name: "Chile" },
  { code: "CO", dial: "+57",  flag: "🇨🇴", name: "Colômbia" },
  { code: "MX", dial: "+52",  flag: "🇲🇽", name: "México" },
  { code: "PY", dial: "+595", flag: "🇵🇾", name: "Paraguai" },
  { code: "UY", dial: "+598", flag: "🇺🇾", name: "Uruguai" },
  { code: "PE", dial: "+51",  flag: "🇵🇪", name: "Peru" },
  { code: "BO", dial: "+591", flag: "🇧🇴", name: "Bolívia" },
  { code: "EC", dial: "+593", flag: "🇪🇨", name: "Equador" },
  { code: "VE", dial: "+58",  flag: "🇻🇪", name: "Venezuela" },
  { code: "ES", dial: "+34",  flag: "🇪🇸", name: "Espanha" },
  { code: "DE", dial: "+49",  flag: "🇩🇪", name: "Alemanha" },
  { code: "FR", dial: "+33",  flag: "🇫🇷", name: "França" },
  { code: "IT", dial: "+39",  flag: "🇮🇹", name: "Itália" },
  { code: "GB", dial: "+44",  flag: "🇬🇧", name: "Reino Unido" },
  { code: "JP", dial: "+81",  flag: "🇯🇵", name: "Japão" },
  { code: "CN", dial: "+86",  flag: "🇨🇳", name: "China" },
];

// Apply visual mask as the user types
export function maskPhone(digits: string, countryCode: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 11);
  if (countryCode === "BR") {
    if (d.length <= 10)
      return d.replace(/^(\d{0,2})(\d{0,4})(\d{0,4})$/, (_, a, b, c) =>
        [a && `(${a}`, b && `) ${b}`, c && `-${c}`].filter(Boolean).join("").replace(/^\((\d{1,2})$/, "($1")
      );
    return d.replace(/^(\d{2})(\d{5})(\d{0,4})$/, "($1) $2-$3");
  }
  if (countryCode === "US")
    return d.slice(0, 10).replace(/^(\d{0,3})(\d{0,3})(\d{0,4})$/, (_, a, b, c) =>
      [a && `(${a}`, b && `) ${b}`, c && `-${c}`].filter(Boolean).join("")
    );
  return d.replace(/(\d{4})(?=\d)/g, "$1 ");
}

function placeholder(dial: string) {
  if (dial === "+55") return "(11) 99999-0000";
  if (dial === "+1")  return "(555) 555-5555";
  return "9999 9999";
}

// Parse a stored value like "+5511999999999" → { dial, maskedDigits }
function parseStored(value: string): { dial: string; maskedDigits: string } {
  if (!value) return { dial: "+55", maskedDigits: "" };
  const sorted = [...PHONE_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  for (const c of sorted) {
    if (value.startsWith(c.dial)) {
      const raw = value.slice(c.dial.length);
      return { dial: c.dial, maskedDigits: maskPhone(raw, c.code) };
    }
  }
  return { dial: "+55", maskedDigits: maskPhone(value, "BR") };
}

type Props = {
  value: string;                  // stored as "+5511999999999"
  onChange: (full: string) => void; // called with dial+rawDigits
  label?: string;
  required?: boolean;
};

export function PhoneInput({ value, onChange, label = "WhatsApp", required }: Props) {
  const parsed = parseStored(value);
  const [dial, setDial] = useState(parsed.dial);
  const [masked, setMasked] = useState(parsed.maskedDigits);

  // Re-sync when the value prop changes (e.g. modal opens with different member)
  useEffect(() => {
    const p = parseStored(value);
    setDial(p.dial);
    setMasked(p.maskedDigits);
  }, [value]);

  function handleDialChange(newDial: string) {
    setDial(newDial);
    setMasked("");
    onChange(newDial);
  }

  function handleNumberChange(raw: string) {
    const country = PHONE_COUNTRIES.find((c) => c.dial === dial)?.code ?? "BR";
    const newMasked = maskPhone(raw, country);
    setMasked(newMasked);
    const digits = newMasked.replace(/\D/g, "");
    onChange(digits ? dial + digits : "");
  }

  return (
    <div className="space-y-1">
      {label && (
        <label className="text-xs font-medium" style={{ color: "var(--brown-dark)" }}>
          {label}
          {required && <span style={{ color: "var(--orange)" }}> *</span>}
        </label>
      )}
      <div className="flex gap-2">
        {/* DDI selector */}
        <div className="relative flex-shrink-0">
          <select
            value={dial}
            onChange={(e) => handleDialChange(e.target.value)}
            className="appearance-none h-full pl-2.5 pr-6 rounded-xl text-sm border outline-none focus:ring-2 transition-all"
            style={{
              borderColor: "var(--cream-dark, #e8ddd3)",
              color: "var(--brown-dark)",
              background: "white",
              paddingTop: "0.625rem",
              paddingBottom: "0.625rem",
            }}
          >
            {PHONE_COUNTRIES.map((c) => (
              <option key={c.code} value={c.dial}>
                {c.flag} {c.dial}
              </option>
            ))}
          </select>
          <span
            className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            ▾
          </span>
        </div>

        {/* Masked number */}
        <input
          type="tel"
          value={masked}
          onChange={(e) => handleNumberChange(e.target.value)}
          placeholder={placeholder(dial)}
          required={required}
          className="flex-1 px-3 py-2.5 rounded-xl text-sm border outline-none focus:ring-2 transition-all"
          style={{
            borderColor: "var(--cream-dark, #e8ddd3)",
            color: "var(--brown-dark)",
          }}
        />
      </div>
    </div>
  );
}
