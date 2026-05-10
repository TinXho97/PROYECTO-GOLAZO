import { handleFlow } from './flowManager';
import { BotResponse } from './responses';

export interface BotContext {
  clientId?: string | null;
  clientName?: string | null;
  clientPhone?: string | null;
}

export async function processMessage(
  userId: string,
  message: string,
  contextOrClientName?: BotContext | string | null,
  legacyClientPhone?: string | null,
): Promise<BotResponse> {
  let context: BotContext;
  if (typeof contextOrClientName === 'string') {
    context = {
      clientName: contextOrClientName,
      clientPhone: legacyClientPhone,
    };
  } else if (contextOrClientName == null) {
    context = {
      clientPhone: legacyClientPhone,
    };
  } else {
    context = contextOrClientName;
  }

  return handleFlow(userId, message, context);
}
