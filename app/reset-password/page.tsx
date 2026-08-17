"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { authClient } from "../../lib/auth-client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) { setStatus("El enlace no es válido o ya venció."); return; }
    const result = await authClient.resetPassword({ token, newPassword: password });
    if (result.error) { setStatus(result.error.message ?? "No pudimos cambiar la contraseña."); return; }
    setStatus("Contraseña actualizada. Ya podés volver e iniciar sesión.");
  };
  return <main className="auth-screen"><section className="auth-card"><span className="brand-mark">M</span><p className="eyebrow">RECUPERAR CUENTA</p><h1>Nueva contraseña</h1><form className="auth-form" onSubmit={submit}><label>Contraseña nueva<input required minLength={10} maxLength={128} type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label><button className="primary-button" type="submit">Guardar contraseña</button></form>{status && <div className="auth-status" role="status">{status}</div>}<Link href="/">Volver a MealBoard</Link></section></main>;
}
