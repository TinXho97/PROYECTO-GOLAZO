import { User } from '../types';

export const getEffectiveClientId = (user?: Pick<User, 'client_id'> | null) => {
  return user?.client_id || null;
};
