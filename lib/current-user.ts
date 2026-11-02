import { getCurrentSession } from "@/lib/session";

export class UnauthenticatedError extends Error {
  constructor() {
    super("not_authenticated");
  }
}

export async function getCurrentUserId(): Promise<string> {
  const session = await getCurrentSession();
  if (!session) throw new UnauthenticatedError();
  return session.userId;
}
