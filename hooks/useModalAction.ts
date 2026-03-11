import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";

export function useModalAction(actionHandler: (modalName: string) => void) {
  const { openModal } = useLocalSearchParams<{ openModal?: string }>();
  const router = useRouter();

  useEffect(() => {
    // 1. 如果 URL 里没有 openModal 参数，直接跳过
    if (!openModal) return;

    // 2. 把提取到的指令交给你在页面里定义的具体逻辑去执行
    actionHandler(openModal);

    // 3. 执行完毕后，无痕清除参数，防止页面刷新时重复执行（替代你之前错误的 router.replace）
    router.setParams({ openModal: '' });
    
  }, [openModal]); // 仅在 openModal 变化时触发
}