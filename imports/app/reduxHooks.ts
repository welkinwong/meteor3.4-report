import { type TypedUseSelectorHook, useDispatch, useSelector, useStore } from 'react-redux';
import type { RootState, RootDispatch } from './store';

export const useRootDispatch = () => useDispatch<RootDispatch>();
export const useRootSelector: TypedUseSelectorHook<RootState> = useSelector;
export const useRootStore = () => useStore<RootState>();
