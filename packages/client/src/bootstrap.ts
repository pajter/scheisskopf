import { getStore } from './redux/store';
import { getConnectedSocket, subscribeStore } from './socket';

const store = getStore();

getConnectedSocket();

subscribeStore(store);
