import { useEffect, useLayoutEffect, useRef } from 'react';
import { goTo } from './route';
import { useSession } from './store';
import { Pick } from './screens/Pick';
import { Newspaper } from './screens/Newspaper';
import { Hotel } from './screens/Hotel';
import { Dossier } from './screens/Dossier';
import { Theory } from './screens/Theory';
import { Ranking } from './screens/Ranking';
import { Settings } from './screens/Settings';
import { PageBubble } from './screens/PageBubble';

const TABS = [
  { id: 'zeitung', label: 'Zeitung', icon: '📰' },
  { id: 'hotel', label: 'Hotel', icon: '🏨' },
  { id: 'akte', label: 'Akte', icon: '🗂️' },
  { id: 'theorie', label: 'Theorie', icon: '💡' },
  { id: 'rangliste', label: 'Rangliste', icon: '🏆' },
] as const;

const SKIN: Record<string, string> = {
  zeitung: 'skin-paper',
  hotel: 'skin-plan',
  akte: 'skin-file',
};

const PLAIN = ['theorie', 'rangliste', 'einstellungen'];

const FONT_PX = { normal: 18, large: 22, xl: 26 } as const;

export function App({ slug, tab: route }: { slug: string; tab: string }) {
  const { view, playerId, notice, busy } = useSession();
  const go = (tab: string) => goTo(slug, tab);
  const bar = useRef<HTMLElement>(null);
  const settings = view?.player.settings ?? {};

  // apply the player's display settings to the page
  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = `${FONT_PX[settings.font_size ?? 'normal']}px`;
    const dark = settings.dark_mode ?? 'auto';
    if (dark === 'auto') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', dark);
  }, [settings.font_size, settings.dark_mode]);

  const skin = SKIN[route] ?? (PLAIN.includes(route) ? '' : 'skin-paper');
  // the page behind the content takes the colour of the area too
  useEffect(() => {
    document.body.className = playerId ? skin : '';
  }, [skin, playerId]);

  // the content starts below the fixed bar, whatever its height (font size, wrapping)
  useLayoutEffect(() => {
    const el = bar.current;
    const set = () =>
      document.documentElement.style.setProperty('--bar-h', `${el?.offsetHeight ?? 0}px`);
    set();
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => {
      ro.disconnect();
      document.documentElement.style.removeProperty('--bar-h');
    };
  }, [playerId, view?.finished]);

  if (!playerId) return <Pick slug={slug} />;

  const screen = (() => {
    switch (route) {
      case 'hotel':
        return <Hotel />;
      case 'akte':
        return <Dossier />;
      case 'theorie':
        return <Theory />;
      case 'rangliste':
        return <Ranking />;
      case 'einstellungen':
        return <Settings />;
      default:
        return <Newspaper />;
    }
  })();

  return (
    <>
      <a className="skip" href="#main">
        Zum Inhalt springen
      </a>
      <header className="bar" ref={bar}>
        <div className="bar-info">
          <button
            className="link"
            onClick={() => go('einstellungen')}
            aria-label="Einstellungen und Spieler wechseln"
          >
            <span aria-hidden="true">{view?.player.avatar ?? '🙂'}</span> {view?.player.name ?? '…'}
          </button>
          {view && (
            <>
              <p className="status" aria-label="Tagesstatus">
                Tag {Math.min(view.day, 24)} · {view.points} Punkte
              </p>
              {!view.finished && (
                <p className="actions" aria-label="Aktionen übrig">
                  Aktionen übrig ({Math.max(0, view.actions.budget - view.actions.used)}/
                  {view.actions.budget})
                </p>
              )}
            </>
          )}
        </div>
        <nav aria-label="Hauptmenü">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={
                route === t.id || (t.id === 'zeitung' && !TABS.some((x) => x.id === route))
                  ? 'on'
                  : ''
              }
              aria-current={route === t.id ? 'page' : undefined}
              onClick={() => go(t.id)}
            >
              <span aria-hidden="true">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>
      </header>
      <main id="main" tabIndex={-1} className={`wrap ${skin}`}>
        {view?.prolog && settings.explanations !== false && route !== 'einstellungen' && (
          <PageBubble />
        )}
        {view ? screen : <p role="status">Das Hotel wird geöffnet …</p>}
      </main>
      <div className="live" role="status" aria-live="polite">
        {busy ? 'Einen Moment …' : notice}
      </div>
    </>
  );
}
