import type AiChat from '@/utils/aichat';
import {
  type NCWebsocket,
  PrivateFriendMessage,
  PrivateGroupMessage,
  GroupMessage,
} from '@/utils/napcat';

export type CommandContext = {
  aiChat: AiChat;
  napcat: NCWebsocket;
  data: PrivateFriendMessage | PrivateGroupMessage | GroupMessage;
  command: string;
  message: string;
};
