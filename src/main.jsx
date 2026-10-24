import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App.jsx';
import { initAnalytics } from './analytics.js';
import './styles.css';
import './planner.css';
import './refinements.css';

initAnalytics();

const root = document.getElementById('root');
const app = <App path={window.location.pathname} />;
if (root.hasChildNodes() && root.querySelector('main')) hydrateRoot(root, app);
else createRoot(root).render(app);
