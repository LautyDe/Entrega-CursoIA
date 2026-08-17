"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { canonicalPaymentProvider, searchPaymentProviders } from "../lib/argentina-payments";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function PaymentProviderCombobox({ value, onChange }: Props) {
  const inputId = useId();
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const results = searchPaymentProviders(value);
  const canonical = canonicalPaymentProvider(value);

  const select = (provider: string) => {
    onChange(provider);
    setActiveIndex(0);
    setOpen(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.min(index + 1, Math.max(0, results.length - 1)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.max(0, index - 1));
    } else if (event.key === "Enter" && open && results[activeIndex]) {
      event.preventDefault();
      select(results[activeIndex].provider);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return <div className="provider-combobox" onBlur={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }}>
    <label htmlFor={inputId}>Banco, billetera o fintech</label>
    <div className={`provider-input ${open ? "open" : ""}`}>
      <span aria-hidden="true">⌕</span>
      <input
        id={inputId}
        value={value}
        role="combobox"
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={open}
        aria-activedescendant={open && results[activeIndex] ? `${listId}-${activeIndex}` : undefined}
        autoComplete="off"
        placeholder="Ej.: Santander Río, BNA o Mercado Pago"
        onChange={(event) => { onChange(event.target.value); setActiveIndex(0); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {value && <button type="button" aria-label="Limpiar búsqueda" onClick={() => { onChange(""); setActiveIndex(0); setOpen(true); }}>×</button>}
    </div>
    {open && <div className="provider-results" id={listId} role="listbox" aria-label="Entidades argentinas">
      {results.length ? results.map((result, index) => <button
        id={`${listId}-${index}`}
        role="option"
        aria-selected={index === activeIndex}
        className={index === activeIndex ? "active" : ""}
        key={result.provider}
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onMouseEnter={() => setActiveIndex(index)}
        onClick={() => select(result.provider)}
      ><span><strong>{result.provider}</strong>{result.matchedAlias && <small>También: {result.matchedAlias}</small>}</span><em>{result.category}</em></button>) : <div className="provider-empty"><strong>No encontramos esa entidad</strong><span>Podés revisar el nombre o agregarla como entidad no verificada.</span></div>}
    </div>}
    <small className={canonical ? "provider-valid" : value ? "provider-custom" : ""}>{canonical ? `✓ Entidad reconocida como ${canonical}` : value ? "La entidad se verificará antes de agregarla." : "Buscá por nombre actual, abreviatura o nombre histórico."}</small>
  </div>;
}
