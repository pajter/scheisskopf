import React from 'react';
import { render } from 'react-dom';

import { App } from './app';

import { getStore } from '../redux/store';

getStore();

render(<App />, document.getElementById('root'));
