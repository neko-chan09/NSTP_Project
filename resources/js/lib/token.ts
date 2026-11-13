// resources/js/lib/token.ts
export const getToken = () =>
  localStorage.getItem("token") || localStorage.getItem("nstp_token");

export const setToken = (token: string) => {
  localStorage.setItem("token", token);
  localStorage.setItem("nstp_token", token);
};

export const removeToken = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("nstp_token");
  localStorage.removeItem("user");
  localStorage.removeItem("nstp_user");
};
export function getCurrentUserId(): string | null {
  try {
    const raw = localStorage.getItem('user') || localStorage.getItem('nstp_user');
    const user = raw ? JSON.parse(raw) : null;
    return user?.id == null ? null : String(user.id);
  } catch { return null; }
}
