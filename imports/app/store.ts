import { addListener, configureStore, createListenerMiddleware, isPlain } from '@reduxjs/toolkit';
import { appSlice } from './slice';

const listenerMiddleware = createListenerMiddleware();

const reducer = {
  [appSlice.name]: appSlice.reducer,
};

export const getStore = (preloadedState = {}) =>
  configureStore({
    reducer,
    preloadedState,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: {
          // Check if value is serializable
          // Treat Date objects as serializable
          isSerializable: (value: unknown) =>
            isPlain(value) || Object.prototype.toString.call(value) === '[object Date]',
        },
      }).prepend(listenerMiddleware.middleware),
  });

export type RootState = ReturnType<ReturnType<typeof getStore>['getState']>;
export type RootDispatch = ReturnType<typeof getStore>['dispatch'];
export const addAppListener = addListener.withTypes<RootState, RootDispatch>();
