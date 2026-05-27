import { EventContext, Next } from '@/types';
import logger from '@/utils/logger';
import { isAuthEvent } from '@/utils/auth';

export default async function handleEvent(ctx: EventContext<'*'>, next: Next) {
  const { event } = ctx;
  let eventPath = event
    .replaceAll('.', '/')
    .replace(/_(\w)/g, (_match, letter) => letter.toUpperCase());
  while (true) {
    const module = await import(`@/event/${eventPath}`).catch(() => undefined);
    if (module?.default && isAuthEvent(eventPath, ctx.data)) {
      await module.default(ctx)?.catch?.(logger.error);
    }
    const indexOf = eventPath.lastIndexOf('/');
    if (indexOf === -1) break;
    eventPath = eventPath.substring(0, indexOf);
  }
}
