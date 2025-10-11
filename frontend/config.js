// Prefer environment variables (Vite): define in frontend/.env or .env.local
export const AuthorizationToken = import.meta?.env?.VITE_AUTH_TOKEN || "";
export const userId = import.meta?.env?.VITE_ULCA_USER_ID || "";
export const ulcaApiKey = import.meta?.env?.VITE_ULCA_API_KEY || "";

/** 
 * you can get it from this link :- https://bhashini.gov.in/ulca/user/register 
 * and to know more visit: https://github.com/stupiddint/anuvaad-client-sdk/blob/master/README_doc.md
 */