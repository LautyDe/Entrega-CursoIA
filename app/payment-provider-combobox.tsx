"use client";

import { useId, useState } from "react";
import { canonicalPaymentProvider, searchPaymentProviders } from "../lib/argentina-payments";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function PaymentProviderCombobox({ value, onChange }: Props) {
  const inputId = useId();
  const listId = useId();
  const [open, setOpen] = useState(false);
  const canonical = canonicalPaymentProvider(value);
  const results = searchPaymentProviders(value);

  const selectProvider = (provider: string) => {
    onChange(provider);
    setOpen(false);
  };

  return <div className="provider-combobox" onBlur={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }}>
    <label htmlFor={inputId}>Banco, billetera o fintech</label>
    <div className="provider-input">
      <span aria-hidden="true">⌕</span>
      <input
        id={inputId}
        value={value}
        role="combobox"
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={open}
        autoComplete="off"
        placeholder="Ej.: Santander Río, BNA o Mercado Pago"
        onChange={(event) => { onChange(event.target.value); setOpen(true); }}
        onFocus={(event) => { event.currentTarget.select(); setOpen(true); }}
        onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}
      />
      {value && <button type="button" aria-label="Limpiar búsqueda" onClick={() => onChange("")}>×</button>}
    </div>
    {open && <div className="provider-results" id={listId} role="listbox" aria-label="Entidades argentinas">
      {results.length > 0 ? results.map((provider) => <button
        type="button"
        role="option"
        aria-selected={canonical === provider}
        key={provider}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => selectProvider(provider)}
      >{provider}</button>) : <p className="provider-empty">No encontramos esa entidad. Revisá el nombre o agregala como no verificada.</p>}
    </div>}
    <small className={canonical ? "provider-valid" : value ? "provider-custom" : ""}>{canonical ? `✓ Entidad reconocida como ${canonical}` : value ? "La entidad se verificará antes de agregarla." : "Escribí para ver la lista completa de entidades argentinas."}</small>
  </div>;
}
