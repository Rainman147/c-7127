import { createRoot } from 'react-dom/client';
import Router from './Router';
import '../index.css';

console.log('[App] Initializing application');

createRoot(document.getElementById("root")!).render(<Router />);