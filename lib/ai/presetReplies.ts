export type LocalAiPresetReply = {
  text: string;
  route?: string;
};

type PresetRule = {
  patterns: RegExp[];
  reply: LocalAiPresetReply;
};

const RULES: PresetRule[] = [
  {
    patterns: [/改.*菜单|菜单.*改|edit.*menu|menu.*edit/i],
    reply: {
      text: "Open Menu, choose a category, then use Add Item or the edit button to update names, prices, images, availability, and options.",
      route: "/(tabs)/menu",
    },
  },
  {
    patterns: [/收款|付款|支付|cash|card|payment|pay/i],
    reply: {
      text: "Open a seat, add items, then use Pay Now for card, cash, or split payment. Cash Pay supports received amount, change, tips, and the cash drawer event.",
      route: "/(tabs)/seats",
    },
  },
  {
    patterns: [/菜单|菜品|商品|menu|item|food/i],
    reply: {
      text: "Use Menu to manage categories, items, images, availability, options, and global changes. Saved menu data is shared with the POS ordering screen.",
      route: "/(tabs)/menu",
    },
  },
  {
    patterns: [/桌台|桌位|座位|点菜|下单|seat|table|order/i],
    reply: {
      text: "Use Seats to open a table, add items, edit options, send to kitchen, change seat, split payment, or mark an order unpaid.",
      route: "/(tabs)/seats",
    },
  },
  {
    patterns: [/营收|收入|销售|订单记录|revenue|sales|cash drawer/i],
    reply: {
      text: "Use Revenue to review today's orders, cash drawer totals, sales charts, order details, and receipt actions.",
      route: "/(tabs)/revenue",
    },
  },
  {
    patterns: [/通知|提醒|消息|alert|notification/i],
    reply: {
      text: "Use Alerts to review pending dine-in notifications and store events from Firestore.",
      route: "/(tabs)/notifications",
    },
  },
  {
    patterns: [/我的|个人|账户|账号|profile|account/i],
    reply: {
      text: "Use Profile to switch stores, view account information, review payment history, and access store settings.",
      route: "/(tabs)/profile",
    },
  },
  {
    patterns: [/设置|门店设置|二维码|改密码|settings|store settings|qr/i],
    reply: {
      text: "Open Settings from Profile to manage store information, payment settings, QR tools, profile details, and password changes.",
      route: "/(tabs)/profile",
    },
  },
];

export function getLocalAiPresetReply(input: string): LocalAiPresetReply {
  const raw = input.trim();
  if (!raw) return fallbackReply();
  if (looksLikeUnsafePath(raw)) return fallbackReply();

  for (const rule of RULES) {
    if (rule.patterns.some((pattern) => pattern.test(raw))) {
      return rule.reply;
    }
  }

  return fallbackReply();
}

export function getLocalAiReplyDelayMs(input: string) {
  const length = input.trim().length;
  return Math.min(1400, 650 + length * 18);
}

function looksLikeUnsafePath(value: string) {
  return value.includes("../") || value.startsWith("/") || value.startsWith("\\");
}

function fallbackReply(): LocalAiPresetReply {
  return {
    text: "I can help with POS tasks like seats, ordering, menu edits, revenue, payments, split bills, receipts, notifications, and profile settings. Tell me what you want to do.",
  };
}
