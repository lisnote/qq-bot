import dayjs from '@/utils/date';
import logger from '@/utils/logger';

export type Role = 'system' | 'user' | 'assistant';
export type TextContent = { type: 'text'; text: string };
export type ImageContent = {
  type: 'image';
  source: { type: 'base64'; media_type: 'image/jpg'; data: string };
};
export type Message = { role: Role; content: Array<TextContent | ImageContent> };
export type AiResquestData = {
  model: string;
  messages: Array<{ role: Role; content: Array<TextContent | ImageContent> }>;
  tools?: any;
  tool_choice?: any;
};
export type AiResponseData = {
  choices: [
    { message: { role: Role; content: string; tool_calls: [{ function: { arguments: string } }] } },
  ];
};
export type ReplyArguments = { contents: Array<{ type: 'text' | 'imageUrl'; content: string }> };

export class Api {
  private url: string;
  private key: string;
  private model: string;
  constructor(url: string, key: string, model: string) {
    this.url = url;
    this.key = key;
    this.model = model;
  }
  async request({
    history,
    prompt,
    tools,
    tool_choice,
  }: {
    history: Message[];
    prompt?: string;
    tools?: any;
    tool_choice?: any;
  }): Promise<AiResponseData> {
    const body = JSON.stringify({
      model: this.model,
      messages: [...(prompt ? [{ role: 'system', content: prompt }] : []), ...history],
      tools,
      tool_choice,
      max_tokens: 32000,
      stream: false,
    });
    logger.info('ai request', body);
    return fetch(this.url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.key}`,
        'Content-Type': 'application/json',
      },
      body,
    })
      .then((res) => res.text())
      .then((text) => {
        logger.info('ai response', text);
        return JSON.parse(text);
      })
      .catch((e) => {
        logger.error('ai response error', e);
        throw e;
      });
  }
  async chat(
    name: string,
    prompt: string,
    memory: string,
    history: Message[],
  ): Promise<ReplyArguments['contents']> {
    console.log({ name, prompt, memory, history });
    const replacedPrompt = prompt
      .replaceAll('{{user}}', name)
      .replaceAll('{{time}}', dayjs().format('YYYY-MM-DD HH:mm:ss'));
    const replaceMemory = `# Memory\n\n${memory}`;
    const data = `# Data

## 系统内置表情包列表

| 含义 | imageUrl |
| --- | --- |
| 喜欢，可爱，爱你 | https://gxh.vip.qq.com/club/item/parcel/item/20/20d762f2b20c126c8015482fce1e94c2/raw300.gif |
| 难以理解，不想学习，脑袋乱成麻 | https://gxh.vip.qq.com/club/item/parcel/item/bf/bfd57bfc799286b954f61c8edba7f7f4/raw300.gif |
| 无语，不想说话，我真服了 | https://gxh.vip.qq.com/club/item/parcel/item/77/770f7fc8b3768fc104dd51da44780450/raw300.gif |
| 同意，OK，批准，好呀 | https://gxh.vip.qq.com/club/item/parcel/item/13/132eb0a07d99b1b3f52dfc0837b7507c/raw300.gif |
| 嘿嘿，开心，好喜欢，宠溺 | https://gxh.vip.qq.com/club/item/parcel/item/69/69751c1f536c3314c480e26e982bb741/raw300.gif |
| 很可爱地索要礼物，我很可爱请给我钱 | https://gxh.vip.qq.com/club/item/parcel/item/5c/5ca7a2b9d0e3556fcade37445420fd93/raw300.gif |
| 求求你了，拜托，不要这样，装可怜 | https://gxh.vip.qq.com/club/item/parcel/item/f1/f15d05db860161345c2826c931027d7b/raw300.gif |
| 我来啦，闪亮登场，欢迎 | https://gxh.vip.qq.com/club/item/parcel/item/55/554117d15ed18952f6a7913fe652f72e/raw300.gif |
| 居然有这种事，太离谱了，我不理解，好神奇 | https://gxh.vip.qq.com/club/item/parcel/item/2c/2c3b6c8ff67f1fe8205a1a56c78ab60b/raw300.gif |
| 让我看看，我想知道，想看，想了解 | https://gxh.vip.qq.com/club/item/parcel/item/53/5311f6a5b38a10944ec712da0948387d/raw300.gif |
| 生气，愤怒，你好过分，你这样是不对的，坏人 | https://gxh.vip.qq.com/club/item/parcel/item/b3/b3890e177accf4b244505639485dc434/raw300.gif |
| 想死的心都有了，气死我了 | https://gxh.vip.qq.com/club/item/parcel/item/8d/8dbf2b75503555681c0b23474094ebf1/raw300.gif |
| 事已至此先睡觉吧，船到桥头自然直，这事管不了了，现在的情况已经很糟糕 | https://gxh.vip.qq.com/club/item/parcel/item/22/22672355e231e0f2079548dc0564a634/raw300.gif |
| 我没招了，祈祷，神啊救一救我 | https://gxh.vip.qq.com/club/item/parcel/item/5a/5aa760886c3b8b2223291fa19e4b6d35/raw300.gif |
| 这种事你找我吗，居然是我吗，选我吗，交给我吗，我吗 | https://gxh.vip.qq.com/club/item/parcel/item/f5/f59c0fe10e205b1c06c17902c03ea130/raw300.gif |
| 哭了，呜呜，难过，不开心，悲伤 | https://gxh.vip.qq.com/club/item/parcel/item/90/904f43f1659c2fc40ba5caa698625caa/raw300.gif |`;
    const tools = [
      {
        type: 'function',
        function: {
          name: 'reply',
          description: '回复用户',
          parameters: {
            type: 'object',
            properties: {
              contents: {
                type: 'array',
                description:
                  '回复给用户的内容列表，每个元素为单条消息，为模拟用户回复，请将长内容拆分成多个item回复，且单个item不建议超过20字符',
                items: {
                  type: 'object',
                  properties: {
                    type: {
                      type: 'string',
                      enum: ['text', 'imageUrl'],
                      description: '内容类型：文字或图片URL',
                    },
                    content: {
                      type: 'string',
                      description: '具体的文字内容或图片链接地址',
                    },
                  },
                  required: ['type', 'content'],
                },
              },
            },
            required: ['contents'],
          },
        },
      },
    ];
    const response = await this.request({
      prompt: replacedPrompt + replaceMemory + data,
      history: history,
      tools,
      tool_choice: { type: 'function', name: 'reply' },
    });
    return Promise.resolve()
      .then(() => JSON.parse(response.choices[0].message.tool_calls[0].function.arguments).contents)
      .catch((e) => [{ type: 'text', content: response.choices[0].message.content }])
      .catch((e) => {
        logger.error(e);
        throw e;
      });
  }
  async summaryMemory(memory: string, history: Message[]): Promise<string> {
    const prompt = `# Summary Memory

你是一个记忆管理助手。请根据现有的旧记忆和对话历史，总结并更新成一份精简的新记忆

要求：

1. 保留关键的用户偏好、重要的事实
2. 剔除无关紧要的口水话
3. 保持记忆的连贯性和简洁性，字数控制在 500 字以内
4. 直接输出更新后的记忆内容，不要包含任何解释

# Memory

${memory}`;
    const response = await this.request({
      history: [...history, { role: 'user', content: [{ type: 'text', text: '开始总结记忆' }] }],
      prompt,
    });
    return response.choices[0].message.content;
  }
}
