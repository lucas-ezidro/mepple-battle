import { CreateQuestion } from "./create-question";
import { FaqList } from "./faq-list";

export default function FAQPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl min-w-0 flex-col gap-6 p-4 sm:p-6 wrap-anywhere">
      <div>
        <h1 className="text-2xl font-semibold">Dúvidas sobre jogos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pergunte sobre regras, estratégias ou qualquer dúvida sobre jogos de tabuleiro e ajude outros jogadores respondendo.
        </p>
      </div>
      <CreateQuestion />
      <FaqList />
    </main>
  );
}