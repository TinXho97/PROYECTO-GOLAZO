import { handleFlow } from './flowManager';
import { BotResponse } from './responses';

export async function processMessage(userId: string, message: string, clientName: string, clientPhone: string): Promise<BotResponse> {
  return handleFlow(userId, message, clientName, clientPhone);
}
