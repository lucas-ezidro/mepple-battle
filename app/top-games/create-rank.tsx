'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Controller, useForm, useWatch } from "react-hook-form";
import { RANK_TYPES, RANK_LABELS, YEARS, RankType } from "./helpers";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { formSchema } from "./schema";

export interface RankDraft {
  type: RankType;
  year?: number;
  theme?: string;
}

type FormValues = z.infer<typeof formSchema>;

interface CreateRankProps {
  hasTop100: boolean;
  onCreate: (rank: RankDraft) => void;
}

export function CreateRank({ hasTop100, onCreate }: CreateRankProps) {
  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    // empty string keeps the Select controlled from the first render
    defaultValues: { type: "" as FormValues["type"], year: "", theme: "" },
  });

  const selectedType = useWatch({ control, name: "type" });

  const onSubmit = (values: FormValues) => {
    if (values.type === "100" && hasTop100) {
      setError("type", { message: "Já existe um Top 100 criado" });
      return;
    }

    onCreate(
      values.type === "100"
        ? { type: values.type, year: Number(values.year) }
        : { type: values.type, theme: values.theme?.trim() }
    );
  };

  return (
    <Card className="w-full max-w-md mt-24">
      <CardHeader>
        <CardTitle>Novo rank</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="type">Tipo do top</Label>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="type" className="w-full">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {RANK_TYPES.map((type) => (
                      <SelectItem
                        key={type}
                        value={type}
                        disabled={type === "100" && hasTop100}
                      >
                        {RANK_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.type && (
              <span className="text-xs text-destructive">{errors.type.message}</span>
            )}
          </div>

          {selectedType === "100" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="year">Ano</Label>
              <Controller
                control={control}
                name="year"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="year" className="w-full">
                      <SelectValue placeholder="Selecione o ano" />
                    </SelectTrigger>
                    <SelectContent>
                      {YEARS.map((year) => (
                        <SelectItem key={year} value={String(year)}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.year && (
                <span className="text-xs text-destructive">{errors.year.message}</span>
              )}
            </div>
          )}

          {selectedType && selectedType !== "100" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="theme">Tema do top</Label>
              <Input
                id="theme"
                placeholder="Ex: Jogos cooperativos"
                {...register("theme")}
              />
              {errors.theme && (
                <span className="text-xs text-destructive">{errors.theme.message}</span>
              )}
            </div>
          )}

          <Button type="submit">Adicionar rank</Button>
        </form>
      </CardContent>
    </Card>
  );
}
