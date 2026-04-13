from nonebot import on_message
from nonebot.adapters.onebot.v11 import GroupMessageEvent, PrivateMessageEvent, Message
from nonebot.rule import to_me

handler = on_message()

@handler.handle()
async def _(event: GroupMessageEvent | PrivateMessageEvent):
    if isinstance(event, GroupMessageEvent):
        msg = f"[CQ:at,qq={event.user_id}] echo: {event.message}"
    else:
        msg = f"echo: {event.message}"
    await handler.finish(Message(msg))
