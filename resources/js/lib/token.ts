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