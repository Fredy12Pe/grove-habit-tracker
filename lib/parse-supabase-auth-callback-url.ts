import * as Linking from 'expo-linking';

function firstParam(
  params: Record<string, string | string[] | undefined> | undefined,
  key: string,
): string | undefined {
  if (!params) return undefined;
  const v = params[key];
  if (typeof v === 'string') return v;
  if (Array.isArray(v) && v[0]) return v[0];
  return undefined;
}

export type SupabaseAuthCallbackParams = {
  code?: string;
  access_token?: string;
  refresh_token?: string;
  error?: string;
  error_description?: string;
};

/**
 * Supabase may put tokens or errors in the query string or URL hash (fragment).
 */
export function parseSupabaseAuthCallbackUrl(
  url: string,
): SupabaseAuthCallbackParams {
  const parsed = Linking.parse(url);
  const qp = parsed.queryParams ?? undefined;
  const out: SupabaseAuthCallbackParams = {
    code: firstParam(qp, 'code'),
    access_token: firstParam(qp, 'access_token'),
    refresh_token: firstParam(qp, 'refresh_token'),
    error: firstParam(qp, 'error'),
    error_description: firstParam(qp, 'error_description'),
  };

  const hashIdx = url.indexOf('#');
  if (hashIdx >= 0) {
    const hash = url.slice(hashIdx + 1);
    try {
      const sp = new URLSearchParams(hash);
      const g = (k: string) => sp.get(k) ?? undefined;
      if (!out.code) out.code = g('code');
      if (!out.access_token) out.access_token = g('access_token');
      if (!out.refresh_token) out.refresh_token = g('refresh_token');
      if (!out.error) out.error = g('error');
      if (!out.error_description) {
        out.error_description = g('error_description');
      }
    } catch {
      /* ignore malformed hash */
    }
  }

  return out;
}

export function mergeSupabaseAuthParams(
  routeParams: Record<string, string | string[] | undefined>,
  deepLinkUrl: string | null,
): SupabaseAuthCallbackParams {
  const fromRoute: SupabaseAuthCallbackParams = {
    code: firstParam(routeParams, 'code'),
    access_token: firstParam(routeParams, 'access_token'),
    refresh_token: firstParam(routeParams, 'refresh_token'),
    error: firstParam(routeParams, 'error'),
    error_description: firstParam(routeParams, 'error_description'),
  };

  if (!deepLinkUrl) {
    return fromRoute;
  }

  const fromUrl = parseSupabaseAuthCallbackUrl(deepLinkUrl);
  return {
    code: fromRoute.code ?? fromUrl.code,
    access_token: fromRoute.access_token ?? fromUrl.access_token,
    refresh_token: fromRoute.refresh_token ?? fromUrl.refresh_token,
    error: fromRoute.error ?? fromUrl.error,
    error_description:
      fromRoute.error_description ?? fromUrl.error_description,
  };
}
