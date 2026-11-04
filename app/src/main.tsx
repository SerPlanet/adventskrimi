import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { Admin } from './screens/Admin';
import { setSlug } from './api';
import { useRoute } from './route';
import { SessionProvider } from './store';
import './styles.css';
import './skins.css';

/** The link /#/<slug>/... chooses the game. Without a usable slug we only show a friendly note. */
function Root() {
  const { slug, tab } = useRoute();
  if (!slug)
    return (
      <main id="main" className="pick wrap">
        <h1>Berghotel Edelweiß</h1>
        <p role="alert">Bitte öffne den Link, den du bekommen hast.</p>
      </main>
    );
  if (slug === 'admin') return <Admin />;
  setSlug(slug);
  return (
    <SessionProvider key={slug} slug={slug}>
      <App slug={slug} tab={tab} />
    </SessionProvider>
  );
}

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <Root />
    </StrictMode>,
  );
}
