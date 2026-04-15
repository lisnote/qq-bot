import { SQL } from 'bun';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';
import defaultPrompt from './prompt.md' with { type: 'text' };
import logger from '@/utils/logger';
import dayjs from '@/utils/date';

export default class AiChat {
  private sql: SQL;
  private constructor({ sqlitePath }: { sqlitePath: string }) {
    this.sql = new SQL('sqlite://' + sqlitePath);
  }
  static async create({ sqlitePath }: { sqlitePath: string }) {
    await mkdir(dirname(sqlitePath), { recursive: true }).catch(() => {});
    const aiChat = new AiChat({ sqlitePath });
    await aiChat.sql`
      CREATE TABLE IF NOT EXISTS user (
        id     TEXT PRIMARY KEY,
        prompt TEXT,
        memory TEXT
      );
    `;
    await aiChat.sql`
      CREATE TABLE IF NOT EXISTS history (
        userId   TEXT,
        question TEXT,
        answer   TEXT,
        time     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    return aiChat;
  }
  async ask(userId: string, userName: string, question: string) {
    // 获取用户设置
    let userConfig = await this.sql`SELECT id, prompt, memory FROM user WHERE id = ${userId}`;
    if (userConfig.length === 0) {
      userConfig = [await this.init(userId)];
    }
    let [{ prompt, memory }] = userConfig;
    // 获取用户聊天记录
    const history = await this.sql`
      SELECT userId, question, answer FROM history
      WHERE userId = ${userId}
      ORDER BY time DESC
    `;
    // 聊天记录>100条, 压缩最早的50条到记忆
    if (history.length > 100) {
      const newMemory = await this.compressMemory(memory, history.slice(0, 50));
      memory = newMemory;
      await this.sql`UPDATE user SET memory = ${memory} WHERE id = ${userId}`;
      await this.sql`
        DELETE FROM history
        WHERE userId = ${userId}
        ORDER BY time ASC
        LIMIT 50
      `;
    }
    // 生成回答
    const answer = await this.generateAnswer(userName, prompt, memory, history, question);
    // 保存回答
    await this.sql`
      INSERT INTO history (userId, question, answer, time)
      VALUES (${userId}, ${question}, ${answer}, ${new Date().toISOString()})
    `;
    // 返回回答
    return answer;
  }
  async setPrompt(userId: string, prompt: string) {
    await this.init(userId);
    await this.sql`
      UPDATE user
      SET prompt = ${prompt}
      WHERE id = ${userId}
    `;
  }
  async clearMemory(userId: string) {
    await this.sql`UPDATE user SET memory = '' WHERE id = ${userId}`;
    await this.sql`DELETE FROM history WHERE userId = ${userId}`;
  }
  private async init(userId: string, prompt = defaultPrompt, memory = '') {
    const data = await this.sql`
      INSERT OR IGNORE INTO user (id, prompt, memory)
      VALUES (${userId}, ${prompt}, ${memory})
    `;
    return { userId, prompt, memory };
  }
  private async compressMemory(
    memory: string,
    history: { question: string; answer: string }[],
  ): Promise<string> {
    return fetch(process.env.AI_BASE_URL!, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + process.env.AI_API_KEY!,
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL_NAME!,
        messages: [
          { role: 'system', content: '# Memory\n\n' + memory },
          ...history
            .map((item) => [
              { role: 'user', content: item.question },
              { role: 'assistant', content: item.answer },
            ])
            .flat(),
          {
            role: 'user',
            content:
              '把前面的聊天记录压缩成一个简短一些的记忆, 与系统prompt中的memory合并, 作为新的memory',
          },
        ],
        stream: false,
      }),
    })
      .then((res) => res.text())
      .then((text) => {
        logger.info('compressMemory:', text);
        const json = JSON.parse(text);
        return json.choices[0].message.content;
      });
  }
  private async generateAnswer(
    userName: string,
    prompt: string,
    memory: string,
    history: { question: string; answer: string }[],
    question: string,
  ): Promise<string> {
    prompt = prompt
      .replace('{{user}}', userName)
      .replace('{{time}}', dayjs().format('YYYY-MM-DD HH:mm:ss'));
    return fetch(process.env.AI_BASE_URL!, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + process.env.AI_API_KEY!,
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL_NAME!,
        messages: [
          {
            role: 'system',
            content: `${prompt
              .replace('{{time}}', dayjs().format('YYYY-MM-DD HH:mm:ss'))
              .replace('{{user}}', userName)}\n\n# Memory\n\n${memory}`,
          },
          ...history
            .map((item) => [
              { role: 'user', content: item.question },
              { role: 'assistant', content: item.answer },
            ])
            .flat(),
          { role: 'user', content: question },
        ],
        stream: false,
      }),
    })
      .then((res) => res.text())
      .then((text) => {
        logger.info('generateAnswer:', text);
        const json = JSON.parse(text);
        return json.choices[0].message.content;
      });
  }
}
