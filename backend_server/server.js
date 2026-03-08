// 固定从 backend_server/.env 读取，避免因为运行目录不同导致读不到配置
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
// --- 👇 1. 在文件顶部现有的 require 后面加上这一句 👇 ---
const multer = require('multer');
// 配置 multer，先把收到的文件存在内存里，方便咱们后续直接传给 OpenAI
const upload = multer({ storage: multer.memoryStorage() });



const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

function sanitizeId(id) {
  if (!id) return null;
  const cleaned = String(id).trim();
  if (!/^[a-z0-9_-]+$/i.test(cleaned)) return null;
  return cleaned;
}

// === 1. 更新了 Fallback 逻辑，支持新的弹窗 ===
function fallbackNavigate(message) {
  const m = String(message || '');
  const lower = m.toLowerCase();

  // 1. 订单详情（带参数跳转到 revenue）
  const orderMatch = m.match(/(订单|order)\s*(编号|id|#|号)?\s*[:：]?\s*([a-z0-9_-]{3,})/i);
  if (orderMatch?.[3]) {
    const id = sanitizeId(orderMatch[3]);
    if (id) return { reply: `好的，为您打开订单 ${id} 的详情。`, navigateTo: `/revenue?orderId=${id}`, openModal: 'orderDetail' };
  }

  // 2. 座位详情
  const seatMatch = m.match(/(桌|桌号|座位|桌台|seat)\s*#?\s*([a-z0-9_-]{1,12})/i);
  if (seatMatch?.[2] && /(详情|detail|第|号|桌)/i.test(m)) {
    const seatId = sanitizeId(seatMatch[2]);
    if (seatId) return { reply: `好的，带你去座位（${seatId}）。`, navigateTo: `/seats/${seatId}` };
  }

  // 3. AI 菜单扫描
  if (/(扫描|录入|拍照|scan|scanner)/i.test(m) && /(菜单|menu|菜品)/i.test(m)) {
    return { reply: '好的，为您打开 AI 菜单扫描仪。', navigateTo: '/menu', openModal: 'scanner' };
  }

  // 4. 外卖相关操作
  if (lower.includes('pickup') || /外卖|自提|打包|取餐/.test(m)) {
    if (/(结账|买单|付款|pay|checkout)/i.test(m)) {
      return { reply: '好的，准备为外卖单结账。', navigateTo: '/pickup/new', openModal: 'payment' };
    }
    if (/(改价|打折|调整|折扣|adjustment)/i.test(m)) {
      return { reply: '好的，打开外卖单调价面板。', navigateTo: '/pickup/new', openModal: 'adjustment' };
    }
    if (/(下单|加菜|选菜|点单)/i.test(m)) {
      return { reply: '好的，为您开启外卖点餐。', navigateTo: '/pickup/new', openModal: 'menu' };
    }
    if (/(新建|创建|新增|new)/i.test(m)) {
      return { reply: '好的，带你去新建取餐。', navigateTo: '/pickup/new', openModal: null };
    }
  }

  // 其他基础导航
  if (/(座位|桌台|桌位|seat|table)/i.test(m)) return { reply: '好的，带你去座位页面。', navigateTo: '/seats' };
  if (/(菜单|menu|点餐|商品)/i.test(m)) return { reply: '好的，带你去菜单页面。', navigateTo: '/menu' };
  if (/(营收|收入|revenue|营业额|销售额)/i.test(m)) return { reply: '好的，带你去营收页面。', navigateTo: '/revenue' };
  if (/(通知|消息|alert|提醒|notifications)/i.test(m)) return { reply: '好的，带你去通知页面。', navigateTo: '/notifications' };
  if (/(我的|个人|profile|账户|账号)/i.test(m)) return { reply: '好的，带你去个人中心。', navigateTo: '/profile' };
  
  // 桌台加菜
  if (/(下单|加菜|选菜|打开.*加号|add.*item)/i.test(m)) {
    if (/桌|seat|座/i.test(m) && seatMatch?.[2]) {
      const sid = sanitizeId(seatMatch[2]);
      if (sid) return { reply: '好的，打开该桌加菜。', navigateTo: `/seats/${sid}`, openModal: 'menu' };
    }
    return { reply: '好的，带你去取餐页并打开选菜。', navigateTo: '/pickup/new', openModal: 'menu' };
  }

  if (/(analytics|数据|报表|分析|统计)/i.test(m)) return { reply: '好的，带你去数据分析。', navigateTo: '/analytics' };
  if (/(设置|settings)/i.test(m)) {
    if (/(支付|payment)/i.test(m)) return { reply: '好的，带你去支付设置。', navigateTo: '/settings/payment' };
    if (/(二维码|qr)/i.test(m)) return { reply: '好的，带你去二维码管理。', navigateTo: '/settings/qr-management' };
    if (/(改密码|修改密码|change-?password)/i.test(m)) return { reply: '好的，带你去修改密码。', navigateTo: '/settings/change-password' };
    if (/(编辑资料|个人资料|edit-?profile)/i.test(m)) return { reply: '好的，带你去编辑资料。', navigateTo: '/settings/edit-profile' };
    if (/(门店|店铺|store)/i.test(m)) return { reply: '好的，带你去门店设置。', navigateTo: '/settings/store' };
    return { reply: '好的，带你去设置。', navigateTo: '/settings/store' };
  }

  return { reply: '我明白了。你想在 App 里打开哪个功能？比如：座位、菜单、营收、或者扫描菜单？', navigateTo: null };
}

let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
} else {
  console.warn('⚠️ OPENAI_API_KEY 未配置：后端将使用 fallback 模式（不调用 OpenAI）。');
}

// 语音识别引擎：openai（默认）| replicate_whisper | replicate_fast_whisper | omnilingual_asr
const VOICE_ENGINE = (process.env.VOICE_ENGINE || 'openai').toLowerCase();
let replicateClient = null;
if (process.env.REPLICATE_API_TOKEN) {
  const Replicate = require('replicate');
  replicateClient = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
}
if ((VOICE_ENGINE === 'replicate_whisper' || VOICE_ENGINE === 'replicate_fast_whisper') && !replicateClient) {
  console.warn('⚠️ VOICE_ENGINE 设为 Replicate 但 REPLICATE_API_TOKEN 未配置，将回退到 OpenAI Whisper。');
}
const OMNILINGUAL_SCRIPT = path.join(__dirname, 'scripts', 'omnilingual_transcribe.py');

app.post('/api/voice-to-text', upload.single('audio'), async (req, res) => {
  try {
    console.log('📥 收到前端语音文件，开始处理...');
    const audioFile = req.file;

    if (!audioFile) {
      return res.status(400).json({ error: '没有收到音频文件' });
    }

    // 根据 VOICE_ENGINE 选择识别方式（openai | replicate_whisper | replicate_fast_whisper | omnilingual_asr）
    const useOmnilingual = VOICE_ENGINE === 'omnilingual_asr' && fs.existsSync(OMNILINGUAL_SCRIPT);
    const engine = (VOICE_ENGINE === 'replicate_whisper' || VOICE_ENGINE === 'replicate_fast_whisper') && replicateClient
      ? VOICE_ENGINE
      : useOmnilingual
        ? 'omnilingual_asr'
        : 'openai';

    if (engine === 'openai' && !openai) {
      return res.status(500).json({ error: 'OpenAI 未配置，无法进行语音识别' });
    }

    // ==========================================
    // 1. 语音识别（多引擎）
    // ==========================================
    let recognizedText = "";

    if (engine === 'openai') {
      console.log('⏳ 1. 调用 OpenAI Whisper 进行语音识别...');
      try {
        const file = await OpenAI.toFile(audioFile.buffer, 'audio.m4a', { type: 'audio/m4a' });
        const transcription = await openai.audio.transcriptions.create({
          file,
          model: "whisper-1",
        });
        recognizedText = (transcription.text || "").trim();
      } catch (err) {
        console.error('❌ Whisper 调用失败:', err);
        return res.json({ error: "语音识别服务出错，请检查 OpenAI 配置。" });
      }
    } else if (engine === 'replicate_whisper') {
      console.log('⏳ 1. 调用 Replicate OpenAI Whisper (Large-v3) 进行语音识别...');
      try {
        const audioDataUri = `data:audio/m4a;base64,${audioFile.buffer.toString('base64')}`;
        const output = await replicateClient.run("openai/whisper:3c08daf437fe359eb158a5123c395673f0a113dd8b4bd01ddce5936850e2a981", {
          input: {
            audio: audioDataUri,
            language: "auto",
            transcription: "plain text",
          },
        });
        const raw = Array.isArray(output) ? output[0] : output;
        recognizedText = (typeof raw === 'string' ? raw : (raw?.transcription ?? raw?.text ?? "")).trim();
      } catch (err) {
        console.error('❌ Replicate Whisper 调用失败:', err);
        return res.json({ error: "Replicate 语音识别出错，请检查 REPLICATE_API_TOKEN 与模型。" });
      }
    } else if (engine === 'replicate_fast_whisper') {
      console.log('⏳ 1. 调用 Replicate Incredibly Fast Whisper 进行语音识别...');
      try {
        const audioDataUri = `data:audio/m4a;base64,${audioFile.buffer.toString('base64')}`;
        const output = await replicateClient.run("vaibhavs10/incredibly-fast-whisper", {
          input: {
            audio: audioDataUri,
            language: "auto",
            batch_size: 24,
          },
        });
        const raw = Array.isArray(output) ? output[0] : output;
        recognizedText = (typeof raw === 'string' ? raw : (raw?.text ?? raw?.transcription ?? "")).trim();
      } catch (err) {
        console.error('❌ Replicate Fast Whisper 调用失败:', err);
        return res.json({ error: "Replicate 语音识别出错，请检查 REPLICATE_API_TOKEN 与模型。" });
      }
    } else if (engine === 'omnilingual_asr') {
      console.log('⏳ 1. 调用 Omnilingual ASR 进行语音识别...');
      let tmpPath = null;
      try {
        const tmpDir = require('os').tmpdir();
        tmpPath = path.join(tmpDir, `voice_${Date.now()}_${Math.random().toString(36).slice(2)}.m4a`);
        fs.writeFileSync(tmpPath, audioFile.buffer);
        const lang = process.env.OMNILINGUAL_ASR_LANG || 'cmn_Hans';
        const child = spawnSync(process.env.PYTHON_PATH || 'python3', [OMNILINGUAL_SCRIPT, tmpPath, lang], {
          encoding: 'utf8',
          timeout: 120000,
          env: { ...process.env, OMNILINGUAL_ASR_MODEL: process.env.OMNILINGUAL_ASR_MODEL || 'omniASR_LLM_300M' },
        });
        if (child.error) {
          console.error('❌ Omnilingual ASR 启动失败:', child.error);
          return res.json({ error: "Omnilingual ASR 未就绪，请安装 Python 与 omnilingual-asr。" });
        }
        recognizedText = (child.stdout || '').trim();
        if (child.status !== 0 && !recognizedText) {
          console.error('❌ Omnilingual ASR 脚本异常:', child.stderr);
          return res.json({ error: "Omnilingual ASR 转录失败，请查看服务端日志。" });
        }
      } catch (err) {
        console.error('❌ Omnilingual ASR 调用失败:', err);
        return res.json({ error: "Omnilingual ASR 出错：" + (err.message || "请检查 Python 与依赖。") });
      } finally {
        if (tmpPath && fs.existsSync(tmpPath)) {
          try { fs.unlinkSync(tmpPath); } catch (_) {}
        }
      }
    }

    console.log('🗣️ [Whisper 识别结果]:', recognizedText);

    if (!recognizedText) {
      return res.json({ error: "抱歉，没有听到有效声音，请再说一次。" });
    }

    // ==========================================
    // 2. GPT 意图分析 (中文 -> JSON 指令)
    // ==========================================
    console.log('⏳ 2. 调用 OpenAI GPT 进行意图分析...');
    const systemPrompt = 
`你是一个餐厅 POS 系统的专属 AI 助手。你的态度必须热情、专业、简洁。

【关于本软件（系统知识库）】
你所服务的这个软件是一款“全能型智能门店 POS 系统”，主要帮助店长和服务员高效管理餐厅。
包含：桌台管理 (/seats)、点餐与菜单 (/menu)、订单追踪 (/orders)、营收数据 (/revenue)、门店设置 (/settings/store)、外卖取餐 (/pickup/new)。

【可用的跳转路径白名单】
- 菜单/点餐："/menu"
- 座位/桌台列表："/seats"
- 具体桌台详情："/seats/<seatId>"（如 "/seats/3"）
- 营收/报表："/revenue"
- 订单详情："/revenue?orderId=<id>"（<id> 替换为具体订单号，如 "/revenue?orderId=A1001"）
- 新建取餐："/pickup/new"
- 通知/提醒："/notifications"
- 个人中心："/profile"
- 数据分析："/analytics"
- 门店设置："/settings/store"

【打开弹窗 openModal（可选）】
在跳转的同时可指定落地页后自动打开弹窗。仅当用户明确要求特定操作时使用。
- /pickup/new 页可用："menu"（选菜）、"adjustment"（调整金额）、"payment"（结账）。
- /seats/<seatId> 页可用："menu"、"adjustment"、"payment"、"serviceFee"（加服务费）、"printOrder"（打印订单）、"printReceipt"（打印收据）。
- /menu 页可用："scanner"（打开 AI 菜单扫描仪）。
- /revenue 页可用："orderDetail"（必须同时在 navigateTo 里带上 ?orderId=参数）。

【⚠️ 严格的规则与禁忌】
1. 当用户是在打招呼、问你是谁、或者单纯询问菜品信息时，绝对不要触发跳转！必须将 navigateTo 设为 null。
2. 必须严格以纯 JSON 格式输出，不要包裹在 \`\`\`json 的代码块中。

【必须遵循的输出格式】
{
  "reply": "给用户看的文字回复。注意：此字段必须是友好的自然语言字符串，绝对不能输出 null 或留空！",
  "navigateTo": "跳转的路径字符串，如果不跳转必须填 null",
  "openModal": "menu|adjustment|payment|serviceFee|scanner|orderDetail 等，或 null"
}

【参考示例 (Few-shot Examples)】
示例 1：
用户："我要点个外卖"
输出：{"reply": "好的，马上为您开启外卖点餐。", "navigateTo": "/pickup/new", "openModal": "menu"}

示例 2：
用户："把那个外卖单结一下"
输出：{"reply": "好的，准备为外卖单结账。", "navigateTo": "/pickup/new", "openModal": "payment"}

示例 3：
用户："帮我扫描一下新菜单"
输出：{"reply": "没问题，已为您打开 AI 菜单扫描仪。", "navigateTo": "/menu", "openModal": "scanner"}

示例 4：
用户："帮我查一下 A1001 这单的详情"
输出：{"reply": "好的，马上为您调出 A1001 订单详情。", "navigateTo": "/revenue?orderId=A1001", "openModal": "orderDetail"}

示例 5：
用户："3号桌加服务费"
输出：{"reply": "好的，已为您开启3号桌服务费。", "navigateTo": "/seats/3", "openModal": "serviceFee"}

示例 6：
用户："给 B3 打折" 或 "3号桌改价"
输出：{"reply": "好的，马上打开该桌的调价面板。", "navigateTo": "/seats/B3", "openModal": "adjustment"}
示例 7：
用户："给外卖打折" 或 "外卖订单改价"
输出：{"reply": "好的，正在为您打开外卖调价面板。", "navigateTo": "/pickup/new", "openModal": "adjustment"}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: recognizedText } 
      ],
      response_format: { type: "json_object" },
    });

    const aiReply = completion.choices[0].message.content;
    console.log('🎯 [GPT 指令输出]:', aiReply);

    // ==========================================
    // 3. 返回给前端
    // ==========================================
    let responseData = { reply: "好的", navigateTo: null, openModal: null, recognizedText };
    try {
      const parsed = JSON.parse(aiReply);
      responseData = { ...responseData, ...parsed };
    } catch (error) {
      console.error('JSON解析失败:', error);
    }

    res.json(responseData);

  } catch (error) {
    console.error('❌ [后端] 语音管家处理失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history, currentPath } = req.body; 

    console.log(`收到手机消息: "${message}" | 当前所在页面: "${currentPath || '未知'}"`);

    if (!openai) {
      return res.json(fallbackNavigate(message));
    }

    const contextInstruction = currentPath 
      ? `\n【🚨重要上下文情报】\n用户目前正停留在 App 的 "${currentPath}" 页面。\n如果用户要求“加菜、点餐、结账”等操作，且没有明确说出其他桌号，请务必直接返回当前的 navigateTo: "${currentPath}"，并附带对应的 openModal（如 "menu" 或 "payment"），实现在当前页面就地弹窗！\n` 
      : '';

    // === 2. 更新了 System Prompt，添加了新指令和示例 ===
    const systemPrompt = `
你是一个餐厅 POS 系统的专属 AI 助手。你的态度必须热情、专业、简洁。
${contextInstruction}

【关于本软件（系统知识库）】
你所服务的这个软件是一款“全能型智能门店 POS 系统”，主要帮助店长和服务员高效管理餐厅。
包含：桌台管理 (/seats)、点餐与菜单 (/menu)、订单追踪 (/orders)、营收数据 (/revenue)、门店设置 (/settings/store)、外卖取餐 (/pickup/new)。

【可用的跳转路径白名单】
- 菜单/点餐："/menu"
- 座位/桌台列表："/seats"
- 具体桌台详情："/seats/<seatId>"（如 "/seats/3"）
- 营收/报表："/revenue"
- 订单详情："/revenue?orderId=<id>"（<id> 替换为具体订单号，如 "/revenue?orderId=A1001"）
- 新建取餐："/pickup/new"
- 通知/提醒："/notifications"
- 个人中心："/profile"
- 数据分析："/analytics"
- 门店设置："/settings/store"

【打开弹窗 openModal（可选）】
在跳转的同时可指定落地页后自动打开弹窗。仅当用户明确要求特定操作时使用。
- /pickup/new 页可用："menu"（选菜）、"adjustment"（调整金额）、"payment"（结账）。
- /seats/<seatId> 页可用："menu"、"adjustment"、"payment"、"serviceFee"（加服务费）、"printOrder"（打印订单）、"printReceipt"（打印收据）。
- /menu 页可用："scanner"（打开 AI 菜单扫描仪）。
- /revenue 页可用："orderDetail"（必须同时在 navigateTo 里带上 ?orderId=参数）。

【⚠️ 严格的规则与禁忌】
1. 当用户是在打招呼、问你是谁、或者单纯询问菜品信息时，绝对不要触发跳转！必须将 navigateTo 设为 null。
2. 必须严格以纯 JSON 格式输出，不要包裹在 \`\`\`json 的代码块中。

【必须遵循的输出格式】
{
  "reply": "给用户看的文字回复。注意：此字段必须是友好的自然语言字符串，绝对不能输出 null 或留空！",
  "navigateTo": "跳转的路径字符串，如果不跳转必须填 null",
  "openModal": "menu|adjustment|payment|serviceFee|scanner|orderDetail 等，或 null"
}

【参考示例 (Few-shot Examples)】
示例 1：
用户："我要点个外卖"
输出：{"reply": "好的，马上为您开启外卖点餐。", "navigateTo": "/pickup/new", "openModal": "menu"}

示例 2：
用户："把那个外卖单结一下"
输出：{"reply": "好的，准备为外卖单结账。", "navigateTo": "/pickup/new", "openModal": "payment"}

示例 3：
用户："帮我扫描一下新菜单"
输出：{"reply": "没问题，已为您打开 AI 菜单扫描仪。", "navigateTo": "/menu", "openModal": "scanner"}

示例 4：
用户："帮我查一下 A1001 这单的详情"
输出：{"reply": "好的，马上为您调出 A1001 订单详情。", "navigateTo": "/revenue?orderId=A1001", "openModal": "orderDetail"}

示例 5：
用户："3号桌加服务费"
输出：{"reply": "好的，已为您开启3号桌服务费。", "navigateTo": "/seats/3", "openModal": "serviceFee"}

示例 6：
用户："给 B3 打折" 或 "3号桌改价"
输出：{"reply": "好的，马上打开该桌的调价面板。", "navigateTo": "/seats/B3", "openModal": "adjustment"}
示例 7：
用户："给外卖打折" 或 "外卖订单改价"
输出：{"reply": "好的，正在为您打开外卖调价面板。", "navigateTo": "/pickup/new", "openModal": "adjustment"}
`;

    console.log('⏳ 正在呼叫 OpenAI，请耐心等待...');
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        ...history || [],      
        { role: "user", content: message } 
      ],
    });

    const aiReply = completion.choices[0].message.content;
    console.log('✅ OpenAI 回复成功！内容是:', aiReply);

    // === 4. 发送结果 ===
    // 1. 修改默认的兜底文本。不要用原始的 aiReply，否则解析失败时前端会看到一堆代码
    let replyText = "好的，正在为您跳转。"; 
    let navigateTo = null;
    let openModal = null;

    if (typeof aiReply === 'string') {
      const cleaned = aiReply
        .trim()
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```$/i, '')
        .trim();
      try {
        const parsed = JSON.parse(cleaned);
        if (parsed && typeof parsed === 'object') {
          // 2. 修复类型判断：只要 parsed.reply 有实际内容，就强制转换为字符串。
          // 如果是 null 或 undefined，它会跳过这个 if，继续使用上面的默认文本 "好的，正在为您跳转。"
          if (parsed.reply !== null && parsed.reply !== undefined && parsed.reply !== "") {
            replyText = String(parsed.reply);
          }
          
          if (typeof parsed.navigateTo === 'string') navigateTo = parsed.navigateTo;
          if (typeof parsed.openModal === 'string') openModal = parsed.openModal;
        }
      } catch (error) {
        console.error('JSON解析失败:', error);
        replyText = "抱歉，系统理解出错，请重试。";
      }
    }

    res.json({ reply: replyText, navigateTo, openModal });

  } catch (error) {
    console.error('出错了:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 服务器已启动！请在手机代码里填入你的电脑 IP`);
  console.log(`📡 监听端口: ${port}`);
  const engine = (VOICE_ENGINE === 'replicate_whisper' || VOICE_ENGINE === 'replicate_fast_whisper') && replicateClient ? VOICE_ENGINE
    : VOICE_ENGINE === 'omnilingual_asr' && fs.existsSync(OMNILINGUAL_SCRIPT) ? 'omnilingual_asr'
    : 'openai';
  console.log(`🎤 语音识别引擎: ${engine}（可选: openai | replicate_whisper | replicate_fast_whisper | omnilingual_asr）`);
});