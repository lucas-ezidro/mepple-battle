export function logProfileError(context: string, error: unknown) {
  if (error instanceof Error) {
    const code = "code" in error && typeof error.code === "string" ? error.code : undefined;
    const cause = error.cause;
    const causeCode =
      cause instanceof Error && "code" in cause && typeof cause.code === "string"
        ? cause.code
        : undefined;
    console.error(context, JSON.stringify({ name: error.name, code, causeCode }));
  } else {
    console.error(context, JSON.stringify({ type: typeof error }));
  }
}
