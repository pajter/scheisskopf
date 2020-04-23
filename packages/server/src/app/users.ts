import { ScheissUser } from './user';

let users: ScheissUser[] = [];

export const removeUser = (id: string) => {
  users = users.filter((user) => user.userId !== id);
};

export const addUser = (user: ScheissUser) => {
  users.push(user);
};

export const getUsers = () => users;

export const findUserByName = (username: string) => {
  return users.find((u) => u.username === username);
};

export const findUserById = (userId: string) => {
  return users.find((u) => u.userId === userId);
};
