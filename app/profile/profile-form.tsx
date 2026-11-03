"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleUserRound } from "lucide-react";
import { toast } from "sonner";
import { updateProfile, uploadAvatar } from "@/client/profile-api";
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
  onAvatarUploaded: (profile: ProfileDetails) => void;
  onUnauthenticated: () => void;
}

export function ProfileForm({ profile, onCancel, onSaved, onAvatarUploaded, onUnauthenticated }: ProfileFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
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
  const avatarUrl = watch("avatarUrl");

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setAvatarError(null);
    setAvatarUploading(true);
    try {
      const saved = await uploadAvatar(file);
      setValue("avatarUrl", saved.avatarUrl ?? "", { shouldDirty: true });
      setAvatarFailed(false);
      onAvatarUploaded(saved);
      toast.success("Foto de perfil atualizada");
    } catch (error) {
      if (error instanceof Error && error.message === "not_authenticated") {
        onUnauthenticated();
      } else if (error instanceof Error && error.message === "invalid_avatar_type") {
        setAvatarError("Envie uma imagem JPEG, PNG ou WebP.");
      } else if (error instanceof Error && error.message === "avatar_too_large") {
        setAvatarError("A imagem deve ter até 5 MB.");
      } else {
        setAvatarError("Não foi possível enviar a foto. Tente novamente.");
      }
    } finally {
      setAvatarUploading(false);
    }
  };

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
            <Label htmlFor="profile-avatar-file">Foto de perfil</Label>
            <div className="flex items-center gap-3">
              <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                {avatarUrl && !avatarFailed ? (
                  <Image
                    key={avatarUrl}
                    src={avatarUrl}
                    alt=""
                    width={64}
                    height={64}
                    unoptimized
                    referrerPolicy="no-referrer"
                    className="size-full object-cover"
                    onError={() => setAvatarFailed(true)}
                  />
                ) : (
                  <CircleUserRound className="size-9 text-muted-foreground" aria-hidden="true" />
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Input
                  id="profile-avatar-file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  aria-describedby={avatarError ? "profile-avatar-error" : "profile-avatar-hint"}
                  disabled={isSubmitting || avatarUploading}
                  onChange={(event) => { void handleAvatarChange(event); }}
                />
                {avatarUploading && (
                  <p className="flex items-center gap-2 text-xs text-muted-foreground" role="status">
                    <Spinner /> Enviando foto...
                  </p>
                )}
              </div>
            </div>
            <input type="hidden" {...register("avatarUrl")} />
            <p id="profile-avatar-hint" className="text-xs text-muted-foreground">
              JPEG, PNG ou WebP, até 5 MB.
            </p>
            {avatarError && (
              <p id="profile-avatar-error" className="text-xs text-destructive" role="alert">
                {avatarError}
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
