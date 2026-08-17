"use client";

import { useId } from "react";
import { argentinaPaymentProviders, canonicalPaymentProvider } from "../lib/argentina-payments";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function PaymentProviderCombobox({ value, onChange }: Props) {
  const inputId = useId();
  const listId = useId();
  const canonical = canonicalPaymentProvider(value);

  return <div className="provider-combobox">
    <label htmlFor={inputId}>Banco, billetera o fintech</label>
    <div className="provider-input">
      <span aria-hidden="true">⌕</span>
      <input
        id={inputId}
        list={listId}
        value={value}
        autoComplete="off"
        placeholder="Ej.: Santander Río, BNA o Mercado Pago"
        onChange={(event) => onChange(event.target.value)}
      />
      {value && <button type="button" aria-label="Limpiar búsqueda" onClick={() => onChange("")}>×</button>}
    </div>
    <datalist id={listId}>{argentinaPaymentProviders.map((provider) => <option key={provider} value={provider} />)}</datalist>
    <small className={canonical ? "provider-valid" : value ? "provider-custom" : ""}>{canonical ? `✓ Entidad reconocida como ${canonical}` : value ? "La entidad se verificará antes de agregarla." : "Escribí para ver la lista completa de entidades argentinas."}</small>
  </div>;
}
