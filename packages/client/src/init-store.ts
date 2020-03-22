import { getStore } from './redux/store';

getStore({
  main: {
    users: [
      { id: 'a', name: 'pajter', ip: '123', priority: 0 },
      { id: 'b', name: 'metaljoe', ip: '456', priority: 1 },
      { id: 'c', name: 'zweedogg', ip: '789', priority: 2 },
    ],
  },
});
