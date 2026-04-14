export interface UserState {
  step: string;
  date: string | null;
  time: string | null;
  pitch_id: string | null;
}

const states = new Map<string, UserState>();

export function getUserState(userId: string): UserState {
  if (!states.has(userId)) {
    states.set(userId, { step: 'idle', date: null, time: null, pitch_id: null });
  }
  return states.get(userId)!;
}

export function updateUserState(userId: string, updates: Partial<UserState>) {
  const current = getUserState(userId);
  states.set(userId, { ...current, ...updates });
}

export function clearUserState(userId: string) {
  states.set(userId, { step: 'idle', date: null, time: null, pitch_id: null });
}
