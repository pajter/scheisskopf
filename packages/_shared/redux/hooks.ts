import {
  useStore as _useStore,
  useSelector as _useSelector,
  useDispatch as _useDispatch,
  TypedUseSelectorHook,
} from 'react-redux';
import { RootState, RootAction } from './types';
import { Dispatch } from 'redux';

export const useStore = () => _useStore<RootState>();
export const useSelector: TypedUseSelectorHook<RootState> = _useSelector;
export const useDispatch = () => _useDispatch<Dispatch<RootAction>>();
