"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { updateProfile } from "@/client/profile-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { profileSchema, type ProfileDetails, type ProfileFormValues } from "@/lib/profile-schema";

interface ProfileFormProps {
  profile: ProfileDetails;
  onCancel: () => void;
  onSaved: (profile: ProfileDetails) => void;
  onUnauthenticated: () => void;
}

export function ProfileForm({ profile, onCancel, onSaved, onUnauthenticated }: ProfileFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: profile.username ?? "",
      email: profile.email ?? "",
      fullName: profile.fullName ?? "",
      avatarUrl: profile.avatarUrl ?? "",
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    setSubmitError(null);
    try {
      const saved = await updateProfile(values);
      onSaved(saved);
      toast.success("Perfil atualizado");
    } catch (error) {
      if (error instanceof Error && error.message === "not_authenticated") {
        onUnauthenticated();
      } else if (error instanceof Error && error.message === "username_taken") {
        setError("username", { message: "Este nome de usuário já está em uso" });
      } else if (error instanceof Error && error.message === "email_taken") {
        setError("email", { message: "Este e-mail já está em uso" });
      } else {
        setSubmitError(
          error instanceof Error && error.message === "invalid_profile"
            ? "Confira os dados informados e tente novamente."
            : "Não foi possível salvar o perfil. Tente novamente."
        );
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle><h2>Editar perfil</h2></CardTitle>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="profile-username">Nome de usuário</Label>
            <Input
              id="profile-username"
              autoComplete="username"
              maxLength={64}
              aria-invalid={Boolean(errors.username)}
              aria-describedby={errors.username ? "profile-username-error" : undefined}
              disabled={isSubmitting}
              {...register("username")}
            />
            {errors.username && (
              <p id="profile-username-error" className="text-xs text-destructive" role="alert">
                {errors.username.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="profile-email">E-mail</Label>
            <Input
              id="profile-email"
              type="email"
              required
              autoComplete="email"
              maxLength={254}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "profile-email-error" : undefined}
              disabled={isSubmitting}
              {...register("email")}
            />
            <p className="text-xs text-muted-foreground">Este é o e-mail usado para entrar na sua conta.</p>
            {errors.email && (
              <p id="profile-email-error" className="text-xs text-destructive" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="profile-full-name">Nome completo</Label>
            <Input
              id="profile-full-name"
              autoComplete="name"
              maxLength={120}
              aria-invalid={Boolean(errors.fullName)}
              aria-describedby={errors.fullName ? "profile-full-name-error" : undefined}
              disabled={isSubmitting}
              {...register("fullName")}
            />
            {errors.fullName && (
              <p id="profile-full-name-error" className="text-xs text-destructive" role="alert">
                {errors.fullName.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="profile-avatar">Link da foto de perfil</Label>
            <Input
              id="profile-avatar"
              type="url"
              placeholder="https://exemplo.com/foto.jpg"
              maxLength={2048}
              aria-invalid={Boolean(errors.avatarUrl)}
              aria-describedby={errors.avatarUrl ? "profile-avatar-error" : "profile-avatar-hint"}
              disabled={isSubmitting}
              {...register("avatarUrl")}
            />
            <p id="profile-avatar-hint" className="text-xs text-muted-foreground">
              Informe o link HTTPS de uma imagem acessível publicamente.
            </p>
            {errors.avatarUrl && (
              <p id="profile-avatar-error" className="text-xs text-destructive" role="alert">
                {errors.avatarUrl.message}
              </p>
            )}
          </div>

          {submitError && <p className="text-sm text-destructive" role="alert">{submitError}</p>}

          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner />}
              Salvar perfil
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
