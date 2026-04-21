import { Sql, User } from './sql';
import { Api, ImageContent, Message, TextContent } from './api';

export default class AiChat {
  private api: Api;
  private sql: Sql;
  private constructor({
    sql,
    url,
    key,
    model,
  }: {
    sql: Sql;
    url: string;
    key: string;
    model: string;
  }) {
    this.sql = sql;
    this.api = new Api(url, key, model);
  }
  static async create({
    sqlitePath,
    url,
    key,
    model,
  }: {
    sqlitePath: string;
    url: string;
    key: string;
    model: string;
  }) {
    const sql = await Sql.create(sqlitePath);
    const aiChat = new AiChat({ sql, url, key, model });
    return aiChat;
  }
  async chat(userId: string, userName: string, content: NonNullable<Message['content']>) {
    // 获取用户设置
    let { prompt, memory } = await this.sql.getUser(userId);
    this.sql.insertHistory(userId, 'user', content);
    // 获取用户聊天记录
    const history = await this.sql.getHistory(userId);
    // 聊天记录>200条, 压缩最早的100条到记忆
    const historyIds = Array.from(new Set(history.map((v) => v.historyId)));
    if (historyIds.length > 200) {
      const oldMemoryIndex = history.findIndex((v) => v.historyId > historyIds[100]);
      const oldMemory = history.splice(0, oldMemoryIndex);
      const messages = this.sql.historyToMessages(oldMemory);
      memory = await this.api.summaryMemory(memory, messages);
      await this.sql.update('user', { id: userId, memory });
      await this.sql.removeHistory(oldMemory.map((v) => v.historyId));
    }
    // 生成回答
    const messages = this.sql.historyToMessages(history);
    messages.push({ role: 'user', content });
    const reply = await this.api.chat(userName, prompt, memory, messages);
    await this.sql.insertHistory(
      userId,
      'assistant',
      reply.map((v) =>
        v.type === 'text'
          ? ({ type: 'text', text: v.content } as TextContent)
          : ({ type: 'image_url', image_url: { url: v.content } } as ImageContent),
      ),
    );
    return reply;
  }
  async updateUser(user: Partial<User> & { id: User['id'] }) {
    await this.sql.initUser(user.id);
    await this.sql.update('user', user);
  }
  async clearUserHistory(userId: string) {
    await this.sql.clearUserHistory(userId);
  }
}
