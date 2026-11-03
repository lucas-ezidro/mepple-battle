import { socialRequest } from "./social-api";
import type { FaqQuestionInput } from "@/lib/faq-schema";

export function createFaqQuestion(input: FaqQuestionInput) {
  return socialRequest<{ id: string }>("/api/faq", { method: "POST", body: JSON.stringify(input) });
}
