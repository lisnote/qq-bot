export const emojiList: { name: string; emotion: string; url: string }[] = [
  {
    name: '比心',
    emotion: '喜欢，可爱，爱你',
    url: 'https://gxh.vip.qq.com/club/item/parcel/item/20/20d762f2b20c126c8015482fce1e94c2/raw300.gif',
  },
  {
    name: '地铁米粒',
    emotion: '难以理解，不想学习，脑袋乱成麻',
    url: 'https://gxh.vip.qq.com/club/item/parcel/item/bf/bfd57bfc799286b954f61c8edba7f7f4/raw300.gif',
  },
  {
    name: '汗',
    emotion: '无语，不想说话，我真服了',
    url: 'https://gxh.vip.qq.com/club/item/parcel/item/77/770f7fc8b3768fc104dd51da44780450/raw300.gif',
  },
  {
    name: '好',
    emotion: '同意，OK，批准，好呀',
    url: 'https://gxh.vip.qq.com/club/item/parcel/item/13/132eb0a07d99b1b3f52dfc0837b7507c/raw300.gif',
  },
  {
    name: '嘿嘿',
    emotion: '嘿嘿，开心，好喜欢，宠溺',
    url: 'https://gxh.vip.qq.com/club/item/parcel/item/69/69751c1f536c3314c480e26e982bb741/raw300.gif',
  },
  {
    name: '可爱',
    emotion: '很可爱地索要礼物，我很可爱请给我钱',
    url: 'https://gxh.vip.qq.com/club/item/parcel/item/5c/5ca7a2b9d0e3556fcade37445420fd93/raw300.gif',
  },
  {
    name: '可怜',
    emotion: '求求你了，拜托，不要这样，装可怜',
    url: 'https://gxh.vip.qq.com/club/item/parcel/item/f1/f15d05db860161345c2826c931027d7b/raw300.gif',
  },
  {
    name: '来啦',
    emotion: '我来啦，闪亮登场，欢迎',
    url: 'https://gxh.vip.qq.com/club/item/parcel/item/55/554117d15ed18952f6a7913fe652f72e/raw300.gif',
  },
  {
    name: '米粒宇宙',
    emotion: '居然有这种事，太离谱了，我不理解，好神奇',
    url: 'https://gxh.vip.qq.com/club/item/parcel/item/2c/2c3b6c8ff67f1fe8205a1a56c78ab60b/raw300.gif',
  },
  {
    name: '让我看看',
    emotion: '让我看看，我想知道，想看，想了解',
    url: 'https://gxh.vip.qq.com/club/item/parcel/item/53/5311f6a5b38a10944ec712da0948387d/raw300.gif',
  },
  {
    name: '生气',
    emotion: '生气，愤怒，你好过分，你这样是不对的，坏人',
    url: 'https://gxh.vip.qq.com/club/item/parcel/item/b3/b3890e177accf4b244505639485dc434/raw300.gif',
  },
  {
    name: '似了',
    emotion: '想死的心都有了，气死我了',
    url: 'https://gxh.vip.qq.com/club/item/parcel/item/8d/8dbf2b75503555681c0b23474094ebf1/raw300.gif',
  },
  {
    name: '事已至此',
    emotion: '事已至此先睡觉吧，船到桥头自然直，这事管不了了，现在的情况已经很糟糕',
    url: 'https://gxh.vip.qq.com/club/item/parcel/item/22/22672355e231e0f2079548dc0564a634/raw300.gif',
  },
  {
    name: '瘫了',
    emotion: '我没招了，祈祷，神啊救一救我',
    url: 'https://gxh.vip.qq.com/club/item/parcel/item/5a/5aa760886c3b8b2223291fa19e4b6d35/raw300.gif',
  },
  {
    name: '我吗',
    emotion: '这种事你找我吗，居然是我吗，选我吗，交给我吗，我吗',
    url: 'https://gxh.vip.qq.com/club/item/parcel/item/f5/f59c0fe10e205b1c06c17902c03ea130/raw300.gif',
  },
  {
    name: '呜呜',
    emotion: '哭了，呜呜，难过，不开心，悲伤',
    url: 'https://gxh.vip.qq.com/club/item/parcel/item/90/904f43f1659c2fc40ba5caa698625caa/raw300.gif',
  },
];

export const emojiNameList = emojiList.map((item) => item.name);
export const emojiEmotionList = emojiList.map((item) => item.emotion);
export const emojiUrlList = emojiList.map((item) => item.url);
export const emojiNameMap = new Map(emojiList.map((item) => [item.name, item]));
export const emojiEmotionMap = new Map(emojiList.map((item) => [item.emotion, item]));
