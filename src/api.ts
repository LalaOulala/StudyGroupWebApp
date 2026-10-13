export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function api<T>(
  path: string,
  body?: unknown,
  method?: string,
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    credentials: "same-origin",
    method: method ?? (body !== undefined ? "POST" : "GET"),
    headers:
      body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const result = await response.json();
  if (!response.ok)
    throw new ApiError(
      result.error ?? "Impossible de terminer cette action.",
      response.status,
    );
  return result;
}
export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Une erreur est survenue.";
export const formatDate = (date: number) =>
  new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(
    date,
  );
export const formatMinutes = (minutes: number) =>
  minutes >= 60
    ? `${Math.floor(minutes / 60)} h ${minutes % 60 ? `${minutes % 60} min` : ""}`
    : `${minutes} min`;
