import { getStore } from './redux/store';

getStore({
  main: {
    users: [
      { id: 'a', name: 'a', ip: '1', priority: 0 },
      { id: 'b', name: 'b', ip: '2', priority: 1 },
      { id: 'c', name: 'c', ip: '3', priority: 2 },
      { id: 'd', name: 'd', ip: '4', priority: 3 },
      { id: 'e', name: 'e', ip: '5', priority: 4 },
      { id: 'f', name: 'f', ip: '6', priority: 5 },
      { id: 'g', name: 'g', ip: '7', priority: 6 },
      { id: 'h', name: 'h', ip: '8', priority: 7 },
    ],
  },
});
