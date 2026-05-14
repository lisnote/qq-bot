import dayjs from '@/utils/date';
import logger from '@/utils/logger';
import systemFeature from './prompt/systemFeature.md' with { type: 'text' };

export type ModelInfo = {
  url: string;
  key: string;
  model: string;
};
export type Role = 'system' | 'user' | 'assistant' | 'tool';
export type TextContent = { type: 'text'; text: string };
export type ImageContent = {
  type: 'image';
  source: {
    type: 'base64';
    media_type: 'image/jpeg';
    data: string;
  };
};
export type Message = {
  role: Role;
  content?: Array<TextContent | ImageContent>;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
};
export type AiResquestData = {
  model: string;
  messages: Message[];
  tools?: any;
  tool_choice?: any;
};
export type AiResponseData<T = any> = {
  content: Array<
    | {
        type: 'text';
        text: string;
      }
    | { type: 'tool_use'; input: T }
  >;
};
export type ReplyArguments = { contents: Array<{ type: 'text' | 'imageUrl'; content: string }> };

export class Api {
  private chatModel: ModelInfo;
  private visionModel: ModelInfo;
  constructor({ chat, vision }: { chat: ModelInfo; vision: ModelInfo }) {
    this.chatModel = chat;
    this.visionModel = vision;
  }
  async request<T = any>({
    model,
    history,
    prompt,
    tools,
    tool_choice,
  }: {
    model: ModelInfo;
    history: Message[];
    prompt?: string;
    tools?: any;
    tool_choice?: any;
  }): Promise<AiResponseData<T>> {
    const body = JSON.stringify({
      model: model.model,
      ...(prompt ? { system: prompt } : {}),
      messages: history,
      tools,
      max_tokens: 3200,
      tool_choice,
      stream: false,
    });
    logger.info('ai request', body);
    return fetch(model.url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${model.key}`,
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
    const replacedPrompt = (prompt + '\n\n' + systemFeature)
      .replaceAll('{{user}}', name)
      .replaceAll('{{time}}', dayjs().format('YYYY-MM-DD HH:mm:ss'))
      .replaceAll('{{memory}}', memory);
    const tools = [
      {
        name: 'reply',
        description: '回复用户',
        input_schema: {
          type: 'object',
          properties: {
            contents: {
              type: 'array',
              description:
                '回复给用户的内容列表，每个元素为单条消息，为模拟用户回复，必须在句号、换行、发送表情包等适合换句的情况时拆分成成多个元素',
              items: {
                type: 'object',
                properties: {
                  type: {
                    type: 'string',
                    enum: ['text', 'imageUrl'],
                    description:
                      '发送文字时必须使用text类型，发送图片、表情包时必须使用imageUrl类型',
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
    ];
    const response = await this.request<ReplyArguments>({
      model: this.chatModel,
      prompt: replacedPrompt,
      history: history,
      tools,
      tool_choice: { type: 'tool', name: 'reply' },
    });
    return Promise.resolve()
      .then(() => {
        const toolResp = response.content.find((v) => v.type === 'tool_use')?.input.contents;
        if (toolResp) {
          return toolResp
            .map((v) => {
              return v.content
                .split('\n')
                .filter((v) => v)
                .map((item) => {
                  const type = /^https?:\/\/.*\.(jpg|png|webp|gif)$/.test(item)
                    ? 'imageUrl'
                    : 'text';
                  return { type, content: item };
                });
            })
            .flat() as ReplyArguments['contents'];
        } else {
          return response.content
            .filter((v) => v.type === 'text')
            .map((v) => ({ type: 'text', content: v.text })) as ReplyArguments['contents'];
        }
      })
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
      model: this.chatModel,
      history: [...history, { role: 'user', content: [{ type: 'text', text: '开始总结记忆' }] }],
      prompt,
    });
    return response.content
      .filter((v) => v.type === 'text')
      .map((v) => v.text)
      .join('\n\n');
  }
  async replaceImageToText(content: NonNullable<Message['content']>): Promise<TextContent[]> {
    const imageCount = content.filter((v) => v.type === 'image').length;
    if (imageCount === 0) return content as TextContent[];
    const response = await this.request<{ results: string[] }>({
      model: this.visionModel,
      history: [
        {
          role: 'user',
          content: [
            ...content,
            {
              type: 'text',
              text: `本次对话中一共发送了${imageCount}张图片`,
            },
          ],
        },
      ],
      prompt: `# 聊天助手-图片识别模块

- 你是一个聊天助手中的图片识别模块，用于识别用户发送的图片中的内容
- 请结构化地详细描述并输出本次对话中图片中的内容，包括但不限于文字提取、对象识别、场景识别、动作识别等等，并调用vision_analysis_report描述结果`,
      tools: [
        {
          name: 'vision_analysis_report',
          description: '结构化地输出图片的详细描述',
          input_schema: {
            type: 'object',
            properties: {
              results: {
                type: 'array',
                description: '图片描述列表',
                items: {
                  type: 'string',
                  description: '单张图片的详细描述内容',
                },
              },
            },
            required: ['results'],
          },
        },
      ],
      tool_choice: { type: 'tool', name: 'vision_analysis_report' },
    });
    const result = response.content.find((v) => v.type === 'tool_use')?.input.results;
    return content.map((v, index) => {
      if (v.type === 'text') return v;
      return {
        type: 'text',
        text: `<SystemUserImage>${result?.[index] ?? `image ${index} failed to recognize`}<SystemUserImage>`,
      };
    });
  }
}
