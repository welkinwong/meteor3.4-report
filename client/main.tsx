import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { onPageLoad } from 'meteor/server-render';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { EJSON } from 'meteor/ejson';
import { getStore } from '../imports/app/store';
import { Provider } from 'react-redux';
import { Routes } from '/imports/app/Routes';
import App from '/imports/app/App';

import 'rsuite/dist/rsuite.css';
import './css/stylex.css';

// Read hydration state from window
const preloadedState = EJSON.parse((window as any).__PRELOADED_STATE__);

// Allow state data to be garbage collected
delete (window as any).__PRELOADED_STATE__;

const store = getStore(preloadedState);

const router = createBrowserRouter(Routes, {
  hydrationData: (window as any).__staticRouterHydrationData,
});

const AppTSX = (
  <StrictMode>
    <Provider store={store} serverState={preloadedState}>
      <App>
        <RouterProvider router={router} />
      </App>
    </Provider>
  </StrictMode>
);

onPageLoad(() => {
  hydrateRoot(document.getElementById('react-target') as Element, AppTSX);
});
