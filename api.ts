export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
export const SESSION_EXPIRED_EVENT = 'mytrip:session-expired';

let fetchInterceptorInstalled = false;

function resolveApiBaseUrl() {
  return new URL(API_BASE || window.location.origin, window.location.origin);
}

function isApiRequest(url: URL, apiBaseUrl: URL) {
  const apiBasePath = apiBaseUrl.pathname.replace(/\/$/, '');
  const apiPrefix = `${apiBasePath}/api`.replace(/\/{2,}/g, '/');

  return url.origin === apiBaseUrl.origin && url.pathname.startsWith(apiPrefix);
}

function shouldIgnoreUnauthorized(pathname: string) {
  return (
    pathname.endsWith('/api/login') ||
    pathname.endsWith('/api/forgot-password') ||
    pathname.endsWith('/api/reset-password') ||
    pathname.includes('/api/register/')
  );
}

export function installApiAuthInterceptor() {
  if (fetchInterceptorInstalled || typeof window === 'undefined') {
    return;
  }

  fetchInterceptorInstalled = true;

  const apiBaseUrl = resolveApiBaseUrl();
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const requestUrl = new URL(
      input instanceof Request ? input.url : String(input),
      window.location.origin
    );

    let addedAuthHeader = false;

    if (isApiRequest(requestUrl, apiBaseUrl)) {
      const headers = new Headers(input instanceof Request ? input.headers : init?.headers);
      const sessionToken = localStorage.getItem('sessionToken');

      if (sessionToken && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${sessionToken}`);
        addedAuthHeader = true;
      }

      if (input instanceof Request) {
        input = new Request(input, { ...init, headers });
        init = undefined;
      } else {
        init = { ...init, headers };
      }
    }

    const response = await originalFetch(input, init);

    if (
      addedAuthHeader &&
      response.status === 401 &&
      !shouldIgnoreUnauthorized(requestUrl.pathname)
    ) {
      localStorage.removeItem('sessionToken');
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
    }

    return response;
  };
}
