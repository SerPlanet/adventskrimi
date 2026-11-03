import { useEffect, useState } from 'react';

export interface Route {
  /** game chosen by the link: /#/<slug>/<tab> */
  slug: string | null;
  tab: string;
}

/** Reads #/<slug>/<tab>; query parts after ? or & (e.g. a test clock) are ignored here. */
function parseHash(hash: string): Route {
  const [slug, tab] = hash.replace(/^#\/?/, '').split(/[?&]/)[0]!.split('/');
  return { slug: slug && /^[a-z0-9-]{2,40}$/.test(slug) ? slug : null, tab: tab || 'zeitung' };
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(location.hash));
  useEffect(() => {
    const on = () => setRoute(parseHash(location.hash));
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export const goTo = (slug: string, tab: string) => {
  location.hash = `#/${slug}/${tab}`;
};
