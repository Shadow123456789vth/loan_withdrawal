import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from 'react';

// ---------------------------------------------------------------------------
// Proxy endpoints
//  Dev  → Vite proxy strips prefix and forwards to SN instance
//  Prod → Vercel serverless function handles server-to-server
// ---------------------------------------------------------------------------
const isDev = import.meta.env.DEV;
const OAUTH_URL = isDev ? '/servicenow-oauth' : '/api/servicenow-oauth';
const API_BASE = isDev ? '/servicenow-api' : '/api/servicenow-api';

// In dev, client credentials must be sent by the browser (Vite proxy is transparent).
// In prod, the Vercel function injects them server-side — never exposed to the browser.
const DEV_CLIENT_ID = isDev ? (import.meta.env.VITE_SN_OAUTH_CLIENT_ID as string) : '';
const DEV_CLIENT_SECRET = isDev ? (import.meta.env.VITE_SN_OAUTH_CLIENT_SECRET as string) : '';

// User info path template — {username} is replaced at login time.
// Swap for a Scripted REST path via VITE_SN_USER_INFO_PATH once provisioned.
const USER_INFO_PATH_TEMPLATE =
  (import.meta.env.VITE_SN_USER_INFO_PATH as string | undefined) ??
  '/api/now/table/sys_user?sysparm_fields=sys_id,name,user_name,email,sys_domain,sys_domain.name&sysparm_limit=1&sysparm_query=user_name={username}';

const SESSION_KEY = 'sn_auth';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface SNUser {
  sys_id: string;
  name: string;
  user_name: string;
  email: string;
  sys_domain: { value: string; display_value: string };
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: SNUser | null;
  domainId: string | null;
  domainName: string | null;
}

interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  getToken: () => string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function buildUserInfoURL(username: string): string {
  const path = USER_INFO_PATH_TEMPLATE.replace('{username}', encodeURIComponent(username));
  if (isDev) return `/servicenow-api${path}`;
  return `/api/servicenow-api?path=${encodeURIComponent(path)}`;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const accessTokenRef = useRef<string | null>(null);

  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    domainId: null,
    domainName: null,
  });

  // Restore session from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { accessToken: string; user: SNUser };
        accessTokenRef.current = parsed.accessToken;
        setState({
          isAuthenticated: true,
          isLoading: false,
          user: parsed.user,
          domainId: parsed.user.sys_domain?.value ?? null,
          domainName: parsed.user.sys_domain?.display_value ?? null,
        });
        return;
      } catch {
        sessionStorage.removeItem(SESSION_KEY);
      }
    }
    setState((s) => ({ ...s, isLoading: false }));
  }, []);

  const getToken = useCallback(() => accessTokenRef.current, []);

  const login = useCallback(async (username: string, password: string) => {
    // Build the token request body.
    // In prod the Vercel function supplies client credentials server-side.
    // In dev the Vite proxy is transparent so we include them here.
    let tokenRes: Response;
    if (isDev) {
      // Dev: Vite proxy forwards directly to ServiceNow /oauth_token.do
      // ServiceNow requires application/x-www-form-urlencoded for OAuth
      const scope = import.meta.env.VITE_SN_OAUTH_SCOPE as string | undefined;
      const formBody = new URLSearchParams({
        grant_type: 'password',
        username,
        password,
        client_id: DEV_CLIENT_ID,
        client_secret: DEV_CLIENT_SECRET,
        ...(scope ? { scope } : {}),
      });
      tokenRes = await fetch(OAUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formBody,
      });
    } else {
      // Prod: Vercel function receives JSON and handles the SN conversion server-side
      tokenRes = await fetch(OAUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
    }

    if (!tokenRes.ok) {
      let message = `Authentication failed (${tokenRes.status})`;
      try {
        const err = await tokenRes.json() as { error_description?: string; error?: string };
        message = err.error_description ?? err.error ?? message;
      } catch { /* ignore */ }
      throw new Error(message);
    }

    const { access_token, refresh_token } = await tokenRes.json() as {
      access_token: string;
      refresh_token: string;
    };

    accessTokenRef.current = access_token;

    // Attempt to fetch full user profile + domain context.
    // Falls back to a minimal object if the endpoint is unavailable.
    // Set VITE_SN_USER_INFO_PATH=/api/x_dxcis_loans_wi_0/auth/me once
    // the Scripted REST endpoint is provisioned in the SN instance.
    let user: SNUser;
    try {
      const userRes = await fetch(buildUserInfoURL(username), {
        headers: { Authorization: `Bearer ${access_token}`, Accept: 'application/json' },
      });

      if (!userRes.ok) throw new Error(`${userRes.status}`);

      const body = await userRes.json() as { result?: SNUser[] } | SNUser;
      // Handle both Table API response ({ result: [...] }) and Scripted REST ({ sys_id, ... })
      const record = 'result' in body ? (body as { result: SNUser[] }).result[0] : body as SNUser;
      if (!record) throw new Error('empty');
      user = record;
    } catch {
      // Fallback: construct minimal user from login credentials.
      // Domain context will be unavailable until the Scripted REST endpoint is set up.
      user = {
        sys_id: '',
        name: username,
        user_name: username,
        email: '',
        sys_domain: { value: '', display_value: '' },
      };
    }

    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ accessToken: access_token, refreshToken: refresh_token, user }),
    );

    setState({
      isAuthenticated: true,
      isLoading: false,
      user,
      domainId: user.sys_domain?.value ?? null,
      domainName: user.sys_domain?.display_value ?? null,
    });
  }, []);

  const logout = useCallback(() => {
    accessTokenRef.current = null;
    sessionStorage.removeItem(SESSION_KEY);
    setState({ isAuthenticated: false, isLoading: false, user: null, domainId: null, domainName: null });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
