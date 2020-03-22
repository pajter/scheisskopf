import { getStore } from './redux/store';

getStore({
  main: {
    users: [
      { id: 'a', name: 'pajter', ip: '1', priority: 0 },
      { id: 'b', name: 'metaljoe', ip: '2', priority: 1 },
      { id: 'c', name: 'zweedogg', ip: '3', priority: 2 },
      { id: 'd', name: 'joelke', ip: '4', priority: 3 },
    ],
  },
});
