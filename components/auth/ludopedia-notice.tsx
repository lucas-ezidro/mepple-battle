"use client";

import { useSearchParams } from "next/navigation";

export function LudopediaNotice() {
  const error = useSearchParams().get("ludopedia_error");
  if (!error) return null;
  const messages: Record<string, string> = {
    account_in_use: "Esta conta da Ludopedia já está vinculada a outro usuário.",
    already_linked: "Seu usuário já está vinculado a outra conta da Ludopedia.",
    top_conflict: "A conexão não foi concluída porque as duas contas possuem um Top 100. Remova o novo Top 100 antes de recuperar o anterior.",
  };
  return (
    <p role="alert" className="mx-auto w-full max-w-3xl p-4 text-sm text-destructive wrap-anywhere">
      {messages[error] ?? "Não foi possível vincular sua conta da Ludopedia. Tente novamente."}
      {" "}A vinculação não é necessária para buscar jogos.
    </p>
  );
}
