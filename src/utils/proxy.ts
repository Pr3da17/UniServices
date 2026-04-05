/**
 * Utility to generate proxy URLs for Moodle resources
 */
export function getMoodleProxyUrl(url: string, _sessionId: string | null): string {
  // SSO Fix v4 : La synchronisation par popup rend le proxy inutile.
  // On retourne l'URL directe pour une expérience 100% native.
  return url;
}
