"use client";

import { useEffect, useState, type FormEvent } from "react";
import { authClient } from "../lib/auth-client";

type Mode = "login" | "register" | "forgot";
type Capabilities = { ready: boolean; email: boolean; emailDelivery: boolean; google: boolean };

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", rememberMe: true });
  const [capabilities, setCapabilities] = useState<Capabilities>({ ready: false, email: false, emailDelivery: false, google: false });
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/auth-config").then((response) => response.json()).then(setCapabilities).catch(() => undefined);
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    try {
      if (mode === "register") {
        const result = await authClient.signUp.email({ name: form.name.trim(), email: form.email.trim(), password: form.password, callbackURL: "/" });
        if (result.error) throw new Error(result.error.message);
        if (capabilities.emailDelivery) {
          setStatus("Te enviamos un correo para confirmar tu cuenta.");
        } else {
          window.location.reload();
        }
      } else if (mode === "forgot") {
        const result = await authClient.requestPasswordReset({ email: form.email.trim(), redirectTo: "/reset-password" });
        if (result.error) throw new Error(result.error.message);
        setStatus("Si el email está registrado, vas a recibir un enlace para recuperar tu cuenta.");
      } else {
        const result = await authClient.signIn.email({ email: form.email.trim(), password: form.password, rememberMe: form.rememberMe, callbackURL: "/" });
        if (result.error) throw new Error(result.error.message);
        window.location.reload();
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "No pudimos completar la operación.");
    } finally {
      setBusy(false);
    }
  };

  const googleSignIn = async () => {
    setBusy(true);
    const result = await authClient.signIn.social({ provider: "google", callbackURL: "/" });
    if (result.error) { setStatus(result.error.message ?? "No pudimos iniciar con Google."); setBusy(false); }
  };

  return <main className="auth-screen"><section className="auth-card" aria-labelledby="auth-title">
    <span className="brand-mark">M</span><p className="eyebrow">TU MEALBOARD PERSONAL</p>
    <h1 id="auth-title">{mode === "register" ? "Creá tu cuenta" : mode === "forgot" ? "Recuperá tu acceso" : "Qué bueno verte de nuevo"}</h1>
    <p>{mode === "register" ? "Guardá tu calendario, inventario y descuentos en todos tus dispositivos." : mode === "forgot" ? "Ingresá tu email y te enviaremos un enlace seguro." : "Ingresá para continuar con tu semana organizada."}</p>
    {!capabilities.ready && <div className="auth-notice">La autenticación todavía requiere configurar sus variables privadas.</div>}
    {mode !== "forgot" && <button className="google-button" type="button" disabled={!capabilities.google || busy} onClick={() => void googleSignIn()}><span>G</span> Continuar con Google</button>}
    {mode !== "forgot" && <div className="auth-divider"><span>o continuá con email</span></div>}
    <form className="auth-form" onSubmit={submit}>
      {mode === "register" && <label>Nombre<input required autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>}
      <label>Email<input required type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
      {mode !== "forgot" && <label>Contraseña<input required minLength={10} maxLength={128} type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /><small>Mínimo 10 caracteres.</small></label>}
      {mode === "login" && <label className="remember-check"><input type="checkbox" checked={form.rememberMe} onChange={(event) => setForm({ ...form, rememberMe: event.target.checked })} /> Mantener mi sesión iniciada</label>}
      <button className="primary-button auth-button" disabled={!capabilities.ready || busy || (mode === "register" && !capabilities.email) || (mode === "forgot" && !capabilities.emailDelivery)} type="submit">{busy ? "Procesando…" : mode === "register" ? "Crear cuenta" : mode === "forgot" ? "Enviar enlace" : "Ingresar"}</button>
    </form>
    {status && <div className="auth-status" role="status">{status}</div>}
    <div className="auth-links">
      {mode === "login" && <><button type="button" onClick={() => setMode("forgot")}>Olvidé mi contraseña</button><button type="button" onClick={() => setMode("register")}>Crear una cuenta</button></>}
      {mode !== "login" && <button type="button" onClick={() => setMode("login")}>Volver a iniciar sesión</button>}
    </div>
    <small>Las contraseñas se guardan cifradas. Nunca las mostramos ni las enviamos por email.</small>
  </section></main>;
}

export function AccountPill({ displayName, email }: { displayName: string; email: string }) {
  const signOut = async () => { await authClient.signOut(); window.location.reload(); };
  const initials = displayName.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return <div className="account-pill"><span>{initials}</span><div><strong>{displayName}</strong><small>{email}</small></div><button type="button" onClick={() => void signOut()}>Salir</button></div>;
}
