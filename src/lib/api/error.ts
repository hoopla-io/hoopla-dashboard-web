import axios from "axios";

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError<{ message?: string }>(error)) return fallback;

  const message = error.response?.data?.message?.trim();
  return message || fallback;
}
