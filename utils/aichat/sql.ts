import { SQL } from 'bun';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';
import character from './prompt/character.md' with { type: 'text' };
import { Role, TextContent, ImageContent, Message } from './api';
import { MaybeArray } from '@/types/utils';

export type User = { id: string; prompt: string; memory: string };
export type History = { id: number; userId: string; role: Role };
export type HistoryDetail = { id: number; historyId: number; type: string; data: string };
export type TableMap = {
  user: User;
  history: History;
  historyDetail: HistoryDetail;
};
export type InsertMap = {
  [K in keyof Omit<TableMap, 'user'>]: Omit<TableMap[K], 'id'> & { id?: TableMap[K]['id'] };
} & { user: User };

export class Sql {
  private sql: SQL;
  private constructor(sql: SQL) {
    this.sql = sql;
  }
  static async create(sqlitePath: string) {
    await mkdir(dirname(sqlitePath), { recursive: true }).catch(() => {});
    const sql = new SQL('sqlite://' + sqlitePath);
    await sql`
      CREATE TABLE IF NOT EXISTS user (
        id     TEXT PRIMARY KEY,
        prompt TEXT DEFAULT '',
        memory TEXT DEFAULT ''
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS history (
        id       INTEGER PRIMARY KEY AUTOINCREMENT,
        userId   TEXT,
        role     TEXT
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS historyDetail (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        historyId INTEGER,
        type      TEXT,
        data      TEXT
      );
    `;
    return new Sql(sql);
  }
  async insert<T extends keyof InsertMap>(table: T, obj: MaybeArray<InsertMap[T]>) {
    await this.sql`INSERT INTO ${this.sql(table)} ${this.sql(obj)}`;
  }
  async remove<T extends keyof TableMap>(table: T, id: MaybeArray<TableMap[T]['id']>) {
    const ids = Array.isArray(id) ? id : [id];
    await this.sql`DELETE from ${this.sql(table)} WHERE id IN ${this.sql(ids)}`;
  }
  async update<T extends keyof TableMap>(
    table: T,
    obj: MaybeArray<Partial<TableMap[T]> & { id: TableMap[T]['id'] }>,
  ) {
    const objs = Array.isArray(obj) ? obj : [obj];
    await this.sql.begin(async (tx) => {
      for (const v of objs) {
        await tx`UPDATE ${this.sql(table)} ${this.sql(obj)} WHERE id = ${v.id}`;
      }
    });
  }
  async get<T extends keyof TableMap>(
    table: T,
    id: MaybeArray<TableMap[T]['id']>,
  ): Promise<TableMap[T][]> {
    const ids = Array.isArray(id) ? id : [id];
    return this.sql`SELECT * FROM ${this.sql(table)} WHERE id IN ${this.sql(ids)}`;
  }
  async initUser(userId: string) {
    await this.sql`
      INSERT OR IGNORE INTO user 
      ${this.sql({ id: userId, prompt: character, memory: '' })};
    `;
  }
  async getUser(userId: string): Promise<User> {
    await this.initUser(userId);
    const [data] = await this.get('user', userId);
    return data;
  }
  async insertHistory(userId: string, role: Role, content: NonNullable<Message['content']>) {
    const [{ id }]: { id: number }[] = await this.sql`
      INSERT INTO history (userId, role)
      VALUES (${userId}, ${role})
      RETURNING id
    `;
    await this.insert(
      'historyDetail',
      content.map((v) => ({
        historyId: id,
        type: v.type,
        data: v.type === 'text' ? v.text : v.source.data,
      })),
    );
  }
  async getHistory(userId: string) {
    const rows: { historyId: number; role: Role; type: string; data: string }[] = await this.sql`
      SELECT historyId, role, type, data
      FROM history
               LEFT JOIN historyDetail ON history.id = historyDetail.historyId
      WHERE userId = ${userId}
      ORDER BY history.id, historyDetail.id;
    `;
    return rows;
  }
  async removeHistory(historyIds: number[]) {
    await this.sql.begin(async (tx) => {
      await tx`DELETE FROM history WHERE id IN ${this.sql(historyIds)}`;
      await tx`DELETE FROM historyDetail WHERE historyId IN ${this.sql(historyIds)}`;
    });
  }
  async clearUserHistory(userId: string) {
    await this.sql.begin(async (tx) => {
      await tx`DELETE FROM historyDetail WHERE historyId IN (SELECT id FROM history WHERE userId = ${userId})`;
      await tx`DELETE FROM history WHERE userId = ${userId}`;
    });
  }
  historyToMessages(
    rows: { historyId: number; role: Role; type: string; data: string }[],
  ): Message[] {
    const grouped = rows.reduce(
      (pre, current, index) => {
        if (
          pre[pre.length - 1]?.[pre[pre.length - 1].length - 1]?.historyId === current.historyId
        ) {
          pre[pre.length - 1].push(current);
        } else {
          pre.push([current]);
        }
        return pre;
      },
      [] as { historyId: number; role: Role; type: string; data: string }[][],
    );
    const messages = grouped
      .map((item) => {
        if (item[0].role === 'user') {
          return {
            role: 'user',
            content: item.map((v) => {
              if (v.type === 'text') {
                return { type: 'text', text: v.data } as TextContent;
              } else {
                return {
                  type: 'image',
                  source: { type: 'base64', media_type: 'image/jpeg', data: v.data },
                } as ImageContent;
              }
            }),
          } as Message;
        } else {
          return [
            {
              role: 'assistant',
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    content: item.map((v) => {
                      return { type: v.type === 'text' ? 'text' : 'imageUrl', content: v.data };
                    }),
                  }),
                },
              ],
            } as Message,
          ];
        }
      })
      .flat();
    return messages;
  }
}
