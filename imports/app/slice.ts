import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { TypedUseSelectorHook } from 'react-redux';
import { useRootDispatch, useRootSelector } from './reduxHooks';

interface State {
  appReady: boolean;
}

const initialState: State = {
  appReady: false,
};

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    // Mark App as ready (typically used to know initialization is done)
    setAppReady: (state, _action: PayloadAction<undefined>) => {
      state.appReady = true;
    },
  },
});

export const {
  setAppReady,
} = appSlice.actions;

/**
 * Wrap the selector hook
 * Keep style consistent with other slices
 * @param handle
 * @returns
 */
export const useAppSelector: TypedUseSelectorHook<State> = handle => {
  return useRootSelector(state => handle(state[appSlice.name]));
};

/**
 * Wrap the dispatch hook
 * Keep style consistent with other slices
 * @returns Dispatch
 */
export const useAppDispatch = useRootDispatch;
