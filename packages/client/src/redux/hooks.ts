import {
  useStore as _useStore,
  useSelector as _useSelector,
  useDispatch as _useDispatch,
  TypedUseSelectorHook,
} from 'react-redux';
import { StateRoot, ActionRoot } from './types';
import { Dispatch } from 'redux';

export const useStore = () => _useStore<StateRoot>();
export const useSelector: TypedUseSelectorHook<StateRoot> = _useSelector;
export const useDispatch = () => _useDispatch<Dispatch<ActionRoot>>();
