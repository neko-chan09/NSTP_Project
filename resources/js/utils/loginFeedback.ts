export const validLoginEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export function loginErrorMessage(error: any, student = false): string {
  const status = error?.response?.status ?? error?.status;
  const data = error?.response?.data ?? error?.data;
  if (status === 401) return student
    ? "Invalid credentials. Check your Student ID and password."
    : "Invalid credentials. Check your email and password.";
  if (status === 429) return "Too many sign-in attempts. Please wait a moment before trying again.";
  if (status >= 500) return "The server is temporarily unavailable. Please try again later.";
  if (status === 422) {
    const fields = data?.errors;
    if (fields && typeof fields === "object") {
      const first = Object.values(fields).flat().find(value => typeof value === "string");
      if (typeof first === "string") return first;
    }
    return "Please check the required login details.";
  }
  if (error instanceof TypeError || error?.code === "ERR_NETWORK" || error?.code === "ECONNABORTED" || /network|failed to fetch|timeout/i.test(error?.message || "")) {
    return "Unable to connect. Check your internet connection and try again.";
  }
  if (status === 403) return data?.message || "This account cannot sign in here. Check your selected account type.";
  return "We couldn't sign you in. Please try again.";
}
