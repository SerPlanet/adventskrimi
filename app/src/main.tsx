import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <main>
        <h1>Adventskrimi</h1>
        <p>Hallo! Das Berghotel öffnet bald seine Türen.</p>
      </main>
    </StrictMode>,
  );
}
