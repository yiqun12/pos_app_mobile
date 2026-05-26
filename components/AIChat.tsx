import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import Constants from 'expo-constants';
import { usePathname, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
    ActivityIndicator,
    Animated,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    PanResponder,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// API 地址（推荐）：
// - 开发环境：自动从 Expo host 推断你电脑的局域网 IP（无需每次手改）
// - 生产/特殊网络：用环境变量覆盖 EXPO_PUBLIC_AI_API_URL（例如 http://192.168.1.10:3000/api/chat）
function getDefaultApiUrl() {
  // Expo dev 通常能拿到类似 "10.112.21.246:8081" 或 "exp://10.112.21.246:8081"
  const hostUri =
    (Constants.expoConfig as any)?.hostUri ??
    (Constants as any)?.manifest?.debuggerHost ??
    (Constants as any)?.manifest2?.extra?.expoClient?.hostUri ??
    (Constants as any)?.expoGoConfig?.debuggerHost;

  if (typeof hostUri === 'string' && hostUri.length > 0) {
    const host = hostUri.replace(/^\w+:\/\//, '').split(':')[0];
    if (host) return `http://${host}:3000/api/chat`;
  }

  // Web 兜底用 localhost；真机如果走到这里，说明拿不到 hostUri，建议用 EXPO_PUBLIC_AI_API_URL 覆盖
  if (Platform.OS === 'web') return 'http://localhost:3000/api/chat';
  return 'http://127.0.0.1:3000/api/chat';
}

const API_URL = process.env.EXPO_PUBLIC_AI_API_URL || getDefaultApiUrl();
const VOICE_API_URL = API_URL.replace('/api/chat', '/api/voice-to-text');

type ChatSender = 'ai' | 'user';
type ChatMessage = { id: string; text: string; sender: ChatSender };
type AutoNavMatch = { path: string; reason: string };
const FAB_SIZE = 56;
const FAB_MARGIN = 20;

// --- 替换从这里开始 ---

function isAllowedNavigatePath(rawPath: string) {
  // ⭐️ 核心修改 1：先把 ? 后面的参数砍掉，只拿纯路径去校验白名单
  const path = rawPath.split('?')[0];

  // 静态白名单
  const allowedStatic = new Set([
    '/menu',
    '/seats',
    '/revenue',
    '/notifications',
    '/profile',
    '/pickup/new',
    '/analytics',
    '/settings/store',
    '/settings/payment',
    '/settings/qr-management',
    '/settings/edit-profile',
    '/settings/change-password',
  ]);
  if (allowedStatic.has(path)) return true;

  // 动态白名单：订单详情、桌台详情
  if (/^\/orders\/[a-z0-9_-]{3,}$/i.test(path)) return true;
  if (/^\/seats\/[a-z0-9_-]{1,12}$/i.test(path)) return true;

  return false;
}

const PICKUP_MODALS = new Set(['menu', 'adjustment', 'payment']);
const SEAT_MODALS = new Set(['menu', 'adjustment', 'payment', 'serviceFee', 'printOrder', 'printReceipt']);

function isAllowedOpenModal(rawPath: string, modal: string): boolean {
  if (!rawPath || !modal) return false;
  
  // ⭐️ 核心修改 2：同样要砍掉 ? 参数再判断路径
  const path = rawPath.split('?')[0]; 

  if (path === '/pickup/new') return PICKUP_MODALS.has(modal);
  if (/^\/seats\/[a-z0-9_-]{1,12}$/i.test(path)) return SEAT_MODALS.has(modal);
  
  // ⭐️ 核心修改 3：允许菜单页打开扫描仪，允许收入页打开订单详情
  if (path === '/menu' && modal === 'scanner') return true;
  if (path === '/revenue' && modal === 'orderDetail') return true;

  return false;
}

// --- 替换到这里结束 ---



function normalizeText(input: string) {
  return input.toLowerCase().replace(/\s+/g, '');
}

function matchAutoNavigation(rawText: string): AutoNavMatch | null {
  const text = normalizeText(rawText);
  // 注意：这里把“看/想看/看一下”也算作跳转意图
  const hasGoVerb = /(打开|进入|跳转|带我去|去|查看|看一下|想看|看|前往|到)/.test(rawText);

  // 订单详情（支持：订单123 / 订单#A1B2 / order 123）
  const orderMatch = rawText.match(
    /(订单|order)\s*(编号|id|#|号)?\s*[:：]?\s*([a-z0-9_-]{3,})/i
  );
  if (orderMatch?.[3] && hasGoVerb) {
    return { path: `/orders/${orderMatch[3]}`, reason: 'order_detail' };
  }

  // 桌台详情（支持：桌3 / 桌号 12 / seat 8）
  const seatMatch = rawText.match(
    /(桌|桌号|座位|桌台|seat)\s*#?\s*([a-z0-9_-]{1,12})/i
  );
  if (seatMatch?.[2] && hasGoVerb) {
    return { path: `/seats/${seatMatch[2]}`, reason: 'seat_detail' };
  }

  // 新建取餐
  if (
    (text.includes('pickup') || text.includes('取餐')) &&
    (text.includes('new') || text.includes('新建') || text.includes('创建') || text.includes('新增'))
  ) {
    return { path: '/pickup/new', reason: 'pickup_new' };
  }

  // 数据分析
  if (hasGoVerb && /(analytics|数据|报表|分析|统计)/i.test(rawText)) {
    return { path: '/analytics', reason: 'analytics' };
  }

  // 设置类
  if (hasGoVerb && /(设置|settings)/i.test(rawText)) {
    if (/(支付|payment)/i.test(rawText)) return { path: '/settings/payment', reason: 'settings_payment' };
    if (/(二维码|qr)/i.test(rawText)) return { path: '/settings/qr-management', reason: 'settings_qr' };
    if (/(改密码|修改密码|change-?password)/i.test(rawText))
      return { path: '/settings/change-password', reason: 'settings_change_password' };
    if (/(编辑资料|个人资料|edit-?profile)/i.test(rawText))
      return { path: '/settings/edit-profile', reason: 'settings_edit_profile' };
    if (/(门店|店铺|store)/i.test(rawText)) return { path: '/settings/store', reason: 'settings_store' };
    // 兜底：项目里没有 settings/index，就默认去门店设置
    return { path: '/settings/store', reason: 'settings_default' };
  }

  // Tab 页（更自然的说法，比如“打开菜单/去座位/看营收”等）
  if (hasGoVerb) {
    if (/(菜单|menu|点餐|商品)/i.test(rawText)) return { path: '/menu', reason: 'tab_menu' };
    if (/(座位|桌台|桌位|seat|table)/i.test(rawText)) return { path: '/seats', reason: 'tab_seats' };
    if (/(营收|收入|revenue|营业额|销售额)/i.test(rawText)) return { path: '/revenue', reason: 'tab_revenue' };
    if (/(通知|消息|alert|提醒|notifications)/i.test(rawText))
      return { path: '/notifications', reason: 'tab_notifications' };
    if (/(我的|个人|profile|账户|账号)/i.test(rawText)) return { path: '/profile', reason: 'tab_profile' };
  }

  return null;
}

export default function AIChat() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isTabRoute = /^\/(seats|menu|revenue|notifications|profile)(\/|$)/.test(
    pathname
  );
  // Reserve extra space above tab bar to avoid overlap.
  const fabBottomInset = isTabRoute ? insets.bottom + 112 : insets.bottom + 24;

  const [modalVisible, setModalVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', text: t('aiChat.greeting'), sender: 'ai' },
  ]);
  const [loading, setLoading] = useState(false);
  const [lastAutoNavAt, setLastAutoNavAt] = useState<number>(0);
  const flatListRef = useRef<FlatList>(null);

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const fabPosition = useRef(
    new Animated.ValueXY({
      x: Math.max(FAB_MARGIN, screenWidth - FAB_SIZE - FAB_MARGIN),
      y: Math.max(insets.top + FAB_MARGIN, screenHeight - fabBottomInset - FAB_SIZE),
    })
  ).current;
  const fabCurrent = useRef({
    x: Math.max(FAB_MARGIN, screenWidth - FAB_SIZE - FAB_MARGIN),
    y: Math.max(insets.top + FAB_MARGIN, screenHeight - fabBottomInset - FAB_SIZE),
  });
  const dragStart = useRef({ x: 0, y: 0 });
  const dragging = useRef(false);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const isPressing = useRef(false); 
  const recordStartTime = useRef<number>(0);

  useEffect(() => {
    const id = fabPosition.addListener((value) => {
      fabCurrent.current = value;
    });
    return () => {
      fabPosition.removeListener(id);
    };
  }, [fabPosition]);

  const clampFabX = (x: number) => {
    const minX = FAB_MARGIN;
    const maxX = Math.max(minX, screenWidth - FAB_SIZE - FAB_MARGIN);
    return Math.min(Math.max(x, minX), maxX);
  };

  const clampFabY = (y: number) => {
    const minY = insets.top + FAB_MARGIN;
    const maxY = Math.max(minY, screenHeight - fabBottomInset - FAB_SIZE);
    return Math.min(Math.max(y, minY), maxY);
  };

  useEffect(() => {
    // Keep FAB visible when orientation/safe-area changes.
    const nextX =
      fabCurrent.current.x + FAB_SIZE / 2 < screenWidth / 2
        ? FAB_MARGIN
        : Math.max(FAB_MARGIN, screenWidth - FAB_SIZE - FAB_MARGIN);
    const nextY = clampFabY(fabCurrent.current.y);
    fabPosition.setValue({ x: nextX, y: nextY });
  }, [screenWidth, screenHeight, insets.top, insets.bottom, fabBottomInset]);

  const snapFabToEdge = () => {
    const currentX = fabCurrent.current.x;
    const currentY = fabCurrent.current.y;
    const snappedX =
      currentX + FAB_SIZE / 2 < screenWidth / 2
        ? FAB_MARGIN
        : Math.max(FAB_MARGIN, screenWidth - FAB_SIZE - FAB_MARGIN);
    const snappedY = clampFabY(currentY);

    Animated.spring(fabPosition, {
      toValue: { x: snappedX, y: snappedY },
      useNativeDriver: false,
      speed: 20,
      bounciness: 6,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 3 || Math.abs(gesture.dy) > 3,
      onPanResponderGrant: () => {
        dragging.current = false;
        dragStart.current = { ...fabCurrent.current };
      },
      onPanResponderMove: (_, gesture) => {
        const nextX = clampFabX(dragStart.current.x + gesture.dx);
        const nextY = clampFabY(dragStart.current.y + gesture.dy);
        dragging.current = Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2;
        fabPosition.setValue({ x: nextX, y: nextY });
      },
      onPanResponderRelease: (_, gesture) => {
        const isTap = Math.abs(gesture.dx) < 3 && Math.abs(gesture.dy) < 3;
        if (isTap && !dragging.current) {
          setModalVisible(true);
          return;
        }
        snapFabToEdge();
      },
      onPanResponderTerminate: () => {
        snapFabToEdge();
      },
      onPanResponderTerminationRequest: () => false,
    })
  ).current;

  async function startRecording() {
    isPressing.current = true;
    recordStartTime.current = Date.now();
    setIsRecording(true); 

    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        alert(t('aiChat.micPermissionRequired'));
        setIsRecording(false);
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      // 防抖：如果录音设备准备好时，用户已经松手了，直接扔掉
      if (!isPressing.current) {
        await newRecording.stopAndUnloadAsync();
        return;
      }

      recordingRef.current = newRecording;
      setRecording(newRecording);
    } catch (error) {
      console.error('启动录音失败:', error);
    }
  }

  async function uploadVoiceToText(uri: string) {
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('audio', { uri, name: 'voice_message.m4a', type: 'audio/m4a' } as any);

      const response = await fetch(VOICE_API_URL, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      // 1. 显示用户刚说的话（翻译后的中文）
      if (data.recognizedText) {
        setMessages(prev => [...prev, { id: Date.now().toString(), text: `🎤 ${data.recognizedText}`, sender: 'user' }]);
      }

      // 2. 显示 AI 的回复
      if (data.reply) {
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: String(data.reply), sender: 'ai' }]);
      }

      // 3. 🎯 核心动作：如果有跳转指令，执行跳转！
      if (typeof data.navigateTo === 'string' && data.navigateTo) {
        console.log('🚀 准备跳转到:', data.navigateTo, '打开弹窗:', data.openModal);
        // 👇 就是加上这一句！和文字输入那边完全对齐
        tryAutoNavigatePath(data.navigateTo, data.openModal);
      }

    } catch (error) {
      console.error('上传语音报错:', error);
      alert(t('aiChat.networkRequestFailed'));
    } finally {
      setLoading(false);
    }
  }

  async function stopRecording() {
    isPressing.current = false;
    setIsRecording(false); 

    const currentRecording = recordingRef.current;
    if (!currentRecording) return; 

    try {
      await currentRecording.stopAndUnloadAsync();
      const uri = currentRecording.getURI();
      
      recordingRef.current = null;
      setRecording(null);

      // 核心拦截：按压不到 1 秒的，视为误触，直接抛弃不发请求
      const duration = Date.now() - recordStartTime.current;
      if (duration < 1000) return; 

      if (uri) {
        uploadVoiceToText(uri);
      }
    } catch (error) {
      console.error('停止录音失败:', error);
    }
  }

  

  const tryAutoNavigate = (text: string) => {
    const now = Date.now();
    if (now - lastAutoNavAt < 1500) return false; // 防抖：避免同一句触发两次

    const match = matchAutoNavigation(text);
    if (!match) return false;

    setLastAutoNavAt(now);
    setModalVisible(false);
    // 给 Modal 一个 tick 的时间关闭，避免偶发的导航时序问题
    setTimeout(() => {
      router.push(match.path as any);
    }, 0);
    return true;
  };

  const tryAutoNavigatePath = (path: string, openModal?: string | null) => {
    console.log(`🧭 [前端导航] 收到跳转请求！目标路径: "${path}", 携带参数: "${openModal}"`);
    const now = Date.now();
    if (now - lastAutoNavAt < 1500) return false;
    if (!isAllowedNavigatePath(path)) return false;
    if (openModal && !isAllowedOpenModal(path, openModal)) openModal = undefined;

    setLastAutoNavAt(now);
    setModalVisible(false);
    setTimeout(() => {
      const url = openModal ? `${path}${path.includes('?') ? '&' : '?'}openModal=${encodeURIComponent(openModal)}` : path;
      router.push(url as any);
    }, 0);
    return true;
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    // 1. 显示用户发送的消息
    const userMsg: ChatMessage = { id: Date.now().toString(), text: message, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setMessage(''); 
    setLoading(true);

    try {
      // 2. 发送真正的网络请求
      console.log('正在发送请求到:', API_URL); // 方便你在终端看日志

      // 给 fetch 加超时：网络不通/后端没启动时，不要一直转圈
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      let data: any;
      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
          body: JSON.stringify({
            message: userMsg.text,
            currentPath: pathname,
            // 简单把历史记录传过去，让AI知道上下文
            history: messages.map(m => ({ 
              role: m.sender === 'user' ? 'user' : 'assistant',
              content: m.text
            }))
          }),
        });

        data = await response.json();
        console.log("📥 [前端] 收到后端发来的完整数据:", data);
      } finally {
        clearTimeout(timeoutId);
      }


      // 3. 处理 AI 的回复
      if (data.reply) {
        const aiMsg: ChatMessage = { 
          id: (Date.now() + 1).toString(), 
          text: String(data.reply), 
          sender: 'ai' 
        };
        setMessages(prev => [...prev, aiMsg]);
        
        // 只信任后端下发的 navigateTo；若有 openModal 则一并带在 URL 参数里
        if (typeof data.navigateTo === 'string' && data.navigateTo) {
          tryAutoNavigatePath(data.navigateTo, data.openModal);
        } else {
          // ❌ 删掉原来的 tryAutoNavigate(aiMsg.text);
          // ✅ 如果你非要在前端做兜底猜意图，你应该去猜用户输入的话 (message)，而不是 AI 的回复！
          // 但强烈建议直接留空，让后端完全控制跳转。
        }
      }

    } catch (error) {
      console.error('请求失败:', error);
      // 给用户一个友好的错误提示
      const errorMsg: ChatMessage = { 
        id: (Date.now() + 1).toString(), 
        text:
          (error as any)?.name === 'AbortError'
            ? t('aiChat.requestTimeout')
            : t('aiChat.connectionFailed'),
        sender: 'ai' 
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Animated.View
        style={[
          styles.fab,
          {
            transform: fabPosition.getTranslateTransform(),
          },
        ]}
        {...panResponder.panHandlers}
      >
        <Ionicons name="chatbubble-ellipses-outline" size={28} color="white" />
      </Animated.View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        {/* ⭐️ 核心魔法：KeyboardAvoidingView 必须是 Modal 内部的第一个组件！包裹整个屏幕 */}
        <KeyboardAvoidingView
          behavior="padding"
          style={{ flex: 1 }}
        >
          {/* 半透明黑色遮罩层：它会自动被上面的 flex:1 撑满剩余空间 */}
          <View style={styles.modalOverlay}>
            
            {/* 白色的聊天主面板：注意这里不要用死板的 height: '70%'，用 flex: 0.85 让它灵活占据底部空间 */}
            <View style={[styles.chatContainer, { flex: 0.85, height: 'auto' }]}>
              
              {/* 1. 头部 */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>{t('aiChat.title')}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              {/* 2. 聊天列表 */}
              <FlatList
              // 1. 绑定刚刚创建的控制器
              ref={flatListRef} 
              
              style={{ flex: 1 }}
              data={messages}
              keyExtractor={item => item.id}
              contentContainerStyle={{ padding: 16, paddingBottom: 40}}
              
              // ⭐️ 2. 核心魔法：只要内容尺寸发生变化（增加新消息），就平滑滚动到底部！
              onContentSizeChange={() => {
                setTimeout(() => {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }, 100);
              }}
              onLayout={() => {
                setTimeout(() => {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }, 100);
              }}
              
              renderItem={({ item }) => (
                <View style={[
                  styles.bubble,
                  item.sender === 'user' ? styles.bubbleUser : styles.bubbleAI
                ]}>
                  <Text style={[
                    styles.text,
                    item.sender === 'user' ? styles.textUser : styles.textAI
                  ]}>{item.text}</Text>
                </View>
              )}
            />

              {/* 3. 输入框 */}
              <View style={styles.inputArea}>
                
                {/* 1. 唯一的左侧麦克风 */}
                <Pressable
                  onPressIn={startRecording}
                  onPressOut={stopRecording}
                  hitSlop={20}
                  // 👇 这里直接用 isRecording 控制颜色，录音时纯红，松手时浅灰
                  style={{
                    width: 44,
                    height: 44,
                    backgroundColor: isRecording ? '#FF3B30' : '#f0f0f0', 
                    borderRadius: 22,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 10,
                  }}
                >
                  <View pointerEvents="none">
                    <Ionicons 
                      name={isRecording ? "mic" : "mic-outline"} 
                      size={24} 
                      color={isRecording ? "white" : "#666"} 
                    />
                  </View>
                </Pressable>

                {/* 2. 中间文本输入框 */}
                <TextInput
                  style={styles.input}
                  value={message}
                  onChangeText={setMessage}
                  placeholder={t('aiChat.inputPlaceholder')}
                  returnKeyType="send"
                  onSubmitEditing={sendMessage}
                />

                {/* 3. 右侧发送按钮（这里绝对没有第二个麦克风） */}
                <TouchableOpacity 
                  style={styles.sendBtn} 
                  onPress={sendMessage}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Ionicons name="send" size={20} color="white" />
                  )}
                </TouchableOpacity>

              </View>

            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal> 
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    left: 0,
    top: 0,
    backgroundColor: '#FF6B00',
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 9999,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  chatContainer: {
    backgroundColor: 'white',
    // ❌ 把你原来的 height: '70%' 删掉，已经在上面的代码里用 flex: 0.85 替代了
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  bubble: {
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
    maxWidth: '80%',
  },
  bubbleUser: {
    backgroundColor: '#FF6B00',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  bubbleAI: {
    backgroundColor: '#f0f0f0',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  text: { fontSize: 16 },
  textUser: { color: 'white' },
  textAI: { color: '#333' },
  // 修改后的代码
  inputArea: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    // 加上底部安全距离，防止 iPhone 底部的小黑条挡住输入框
    paddingBottom: 30, 
    backgroundColor: 'white',
    // 👇 新增：让左边麦克风、中间输入框、右边发送按钮，在垂直方向上居中对齐
    alignItems: 'center', 
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 20,
    marginRight: 10,
    fontSize: 16,
    // 👇 新增：强制输入框高度和两边的按钮（44）一样高，这样整体视觉才会统一
    height: 44, 
  },
  sendBtn: {
    backgroundColor: '#FF6B00',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
