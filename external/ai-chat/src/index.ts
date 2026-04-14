import { Context, Schema } from "koishi";

export const name = "ai-chat";

export interface Config {
  savePath: string;
}

export const Config: Schema<Config> = Schema.object({
  savePath: Schema.string().default("./images").description("图片保存目录"),
});

export function apply(ctx: Context, config: Config) {
  ctx.on("message", async (session) => {
    const userId = session.userId;
    const nickname = session.author?.name ?? "未知";
    const message = session.content;
    const timestamp = new Date(
      session.timestamp ?? Date.now(),
    ).toLocaleString();
    ctx.logger.info(
      `用户ID: ${userId}, 昵称: ${nickname}, 消息: ${message}, 时间: ${timestamp}`,
    );
    for (const elem of session.elements ?? []) {
      const fileId = elem.attrs.file;
      const url = elem.attrs.src || elem.attrs.url;
      ctx.logger.info(
        `检测到图片，type=${elem.type}, fileId=${fileId}, url=${url}}`,
      );
    }
  });
}
