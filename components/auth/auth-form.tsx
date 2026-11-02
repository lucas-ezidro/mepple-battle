"use client";

import { useId, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { loginSchema, registerSchema } from "@/lib/auth-schema";
import { getAuthReturnPath } from "@/lib/auth-policy";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const id = `${mode}-${useId()}`;
  const registering = mode === "register";
  const next = getAuthReturnPath(useSearchParams().get("next"));
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const values = {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      ...(registering ? {
        fullName: String(form.get("fullName") ?? ""),
        confirmPassword: String(form.get("confirmPassword") ?? ""),
      } : {}),
    };
    const result = (registering ? registerSchema : loginSchema).safeParse(values);
    setMessage(null);
    if (!result.success) {
      const fields: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !fields[key]) fields[key] = issue.message;
      }
      setErrors(fields);
      return;
    }
    setErrors({});
    setPending(true);
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });
      if (!response.ok) {
        const data: { error: string } = await response.json();
        setMessage(data.error);
        return;
      }
      window.location.assign(next);
    } catch {
      setMessage("Não foi possível concluir a solicitação. Tente novamente.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle><h1>{registering ? "Criar conta" : "Entrar na sua conta"}</h1></CardTitle>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
          {registering && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${id}-name`}>Nome completo</Label>
              <Input id={`${id}-name`} name="fullName" autoComplete="name" maxLength={120}
                disabled={pending} aria-invalid={Boolean(errors.fullName)}
                aria-describedby={errors.fullName ? `${id}-name-error` : undefined} />
              {errors.fullName && <p id={`${id}-name-error`} role="alert" className="text-xs text-destructive">{errors.fullName}</p>}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${id}-email`}>E-mail</Label>
            <Input id={`${id}-email`} name="email" type="email" autoComplete="email" maxLength={254}
              disabled={pending} aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? `${id}-email-error` : undefined} />
            {errors.email && <p id={`${id}-email-error`} role="alert" className="text-xs text-destructive">{errors.email}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${id}-password`}>Senha</Label>
            <Input id={`${id}-password`} name="password" type="password" maxLength={128}
              autoComplete={registering ? "new-password" : "current-password"}
              disabled={pending} aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? `${id}-password-error` : registering ? `${id}-password-hint` : undefined} />
            {registering && <p id={`${id}-password-hint`} className="text-xs text-muted-foreground">Use pelo menos 12 caracteres.</p>}
            {errors.password && <p id={`${id}-password-error`} role="alert" className="text-xs text-destructive">{errors.password}</p>}
          </div>
          {registering && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${id}-confirm`}>Confirmar senha</Label>
              <Input id={`${id}-confirm`} name="confirmPassword" type="password" autoComplete="new-password" maxLength={128}
                disabled={pending} aria-invalid={Boolean(errors.confirmPassword)}
                aria-describedby={errors.confirmPassword ? `${id}-confirm-error` : undefined} />
              {errors.confirmPassword && <p id={`${id}-confirm-error`} role="alert" className="text-xs text-destructive">{errors.confirmPassword}</p>}
            </div>
          )}
          {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
          <Button type="submit" disabled={pending}>
            {pending && <Spinner />}{registering ? "Criar conta" : "Entrar"}
          </Button>
        </form>
        <p className="text-sm text-muted-foreground">
          {registering ? "Já tem uma conta? " : "Ainda não tem uma conta? "}
          <Link className="font-medium text-foreground underline underline-offset-4"
            href={`/${registering ? "login" : "register"}?next=${encodeURIComponent(next)}`}>
            {registering ? "Entrar" : "Criar conta"}
          </Link>
        </p>
        <Link href="/" className="text-sm text-muted-foreground underline underline-offset-4">
          Voltar para a home
        </Link>
      </CardContent>
    </Card>
  );
}
