import React from 'react';
import { render } from 'react-dom';

import { App } from './app';
import { initSocket } from '../socket';
import { getStore } from '../redux/store';

getStore();
initSocket().then(() => {
  render(<App />, document.getElementById('root'));
});
