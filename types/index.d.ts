import type AiChat from '@/utils/aichat';
import type {
  NCWebsocket,
  PrivateFriendMessage,
  PrivateGroupMessage,
  GroupMessage,
  EventKey,
  HandlerResMap,
} from '@/utils/napcat';
import type logger from '@/utils/logger';

export type EventContext<T extends EventKey = EventKey> = {
  event: EventKey;
  napcat: NCWebsocket;
  data: HandlerResMap[T];
  aiChat: AiChat;
};

export type CommandContext = EventContext<'message'> & {
  command: string;
  message: string;
};

export type Next = () => Promise<void>;

export type Middleware<T extends EventKey = EventKey> = (
  context: EventContext<T>,
  next: Next,
) => Promise<void>;
