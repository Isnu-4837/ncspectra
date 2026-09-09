import {StrictMode} from 'react';
// @ts-expect-error react-dom/client does not provide declarations in this project.
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
// @ts-expect-error CSS imports are handled by the bundler and have no TypeScript declarations.
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
