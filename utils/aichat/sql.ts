import { SQL, sql } from 'bun';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';
import defaultPrompt from './prompt.md' with { type: 'text' };
import { Message, Role } from './api';
import { MaybeArray } from '@/types/utils';

export type User = { id: string; prompt?: string; memory?: string };
export type History = { id: number; userId: string; role: Role };
export type HistoryDetail = { id: number; type: string; data: string };
export type TableMap = {
  user: User;
  history: History;
  historyDetail: HistoryDetail;
};
export class Sql {
  sql: SQL;
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
  async insert<T extends keyof TableMap>(table: T, obj: MaybeArray<TableMap[T]>) {
    await this.sql`INSERT INTO ${this.sql(table)} ${this.sql(obj)}`;
  }
  async remove<T extends keyof TableMap>(table: T, id: MaybeArray<TableMap[T]['id']>) {
    const ids = Array.isArray(id) ? id : [id];
    await this.sql`DELETE from ${this.sql(table)} WHERE id IN ${ids}`;
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
    return this.sql`SELECT * FROM ${this.sql(table)} WHERE id IN ${ids}`;
  }
  async getUser(userId: string): Promise<User> {
    await this.sql`
      INSERT OR IGNORE INTO user 
      ${this.sql({ id: userId, prompt: defaultPrompt, memory: '' })};
    `;
    const [data] = await this.get('user', userId);
    return data;
  }
  async insertHistory(userId: string, role: Role, content: Message['content']) {
    const [{ id }]: { id: number }[] = await this.sql`
      INSERT INTO history (userId, role)
      VALUES (${userId}, ${role})
      RETURNING id
    `;
    await this.sql`
      INSERT INTO historyDetail ${this.sql(
        content.map((v) => ({
          historyId: id,
          type: v.type,
          data: v.type === 'text' ? v.text : v.source.data,
        })),
      )}`;
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
  historyToMessages(rows: { historyId: number; role: Role; type: string; data: string }[]) {
    const messages: Message[] = [];
    let currentHistoryId: undefined | number = undefined;
    for (const history of rows) {
      if (history.historyId !== currentHistoryId) {
        messages.push({ role: history.role, content: [] });
        currentHistoryId = history.historyId;
      }
      messages[messages.length - 1].content.push(
        history.type === 'text'
          ? { type: 'text', text: history.data }
          : {
              type: 'image',
              source: { type: 'base64', media_type: 'image/jpg', data: history.data },
            },
      );
    }
    return messages;
  }
}
