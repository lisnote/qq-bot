import type AiChat from '@/utils/aichat';
import type {
  NCWebsocket,
  PrivateFriendMessage,
  PrivateGroupMessage,
  GroupMessage,
  EventKey,
  HandlerResMap,
} from '@/utils/napcat';

export type EventContext<T extends EventKey = EventKey> = {
  aiChat: AiChat;
  napcat: NCWebsocket;
  data: HandlerResMap[T];
};

export type CommandContext = {
  aiChat: AiChat;
  napcat: NCWebsocket;
  data: PrivateFriendMessage | PrivateGroupMessage | GroupMessage;
  command: string;
  message: string;
};
