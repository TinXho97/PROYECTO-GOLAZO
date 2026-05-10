export interface UserState {
  step: string;
  intent: string | null;
  clientId: string | null;
  date: string | null;
  time: string | null;
  pitch_id: string | null;
  pitchName: string | null;
  clientName: string | null;
  clientPhone: string | null;
}

const states = new Map<string, UserState>();
const initialState: UserState = {
  step: 'idle',
  intent: null,
  clientId: null,
  date: null,
  time: null,
  pitch_id: null,
  pitchName: null,
  clientName: null,
  clientPhone: null,
};

export function getUserState(userId: string): UserState {
  if (!states.has(userId)) {
    states.set(userId, { ...initialState });
  }
  return states.get(userId)!;
}

export function updateUserState(userId: string, updates: Partial<UserState>) {
  const current = getUserState(userId);
  states.set(userId, { ...current, ...updates });
}

export function clearUserState(userId: string) {
  states.set(userId, { ...initialState });
}
