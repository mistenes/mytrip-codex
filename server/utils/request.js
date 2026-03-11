export function trimTrailingSlash(value = '') {
  return value.replace(/\/+$/, '');
}

export function getRequestOrigin(req) {
  const forwardedProto = req.get('x-forwarded-proto');
  const protocol = forwardedProto ? forwardedProto.split(',')[0].trim() : req.protocol;
  return `${protocol}://${req.get('host')}`;
}

export function getAppUrl(req) {
  const configuredUrl = trimTrailingSlash(process.env.APP_URL || '');
  return configuredUrl || getRequestOrigin(req);
}

export function buildAppUrl(req, pathname) {
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${getAppUrl(req)}${normalizedPath}`;
}

export function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function splitEnvList(value = '') {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}
