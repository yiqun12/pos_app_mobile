import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "@/lib/i18n";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type AppLanguage = "en" | "zh";

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  isReady: boolean;
};

const STORAGE_KEY = "app_language";

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>("en");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadLanguage = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!mounted) return;

        if (stored === "en" || stored === "zh") {
          setLanguageState(stored);
          await i18n.changeLanguage(stored);
        } else {
          await i18n.changeLanguage("en");
        }
      } catch (error) {
        console.warn("Failed to load app language:", error);
      } finally {
        if (mounted) {
          setIsReady(true);
        }
      }
    };

    void loadLanguage();

    return () => {
      mounted = false;
    };
  }, []);

  const setLanguage = (nextLanguage: AppLanguage) => {
    void (async () => {
      await i18n.changeLanguage(nextLanguage);
      setLanguageState(nextLanguage);
      await AsyncStorage.setItem(STORAGE_KEY, nextLanguage);
    })().catch((error) => {
      console.warn("Failed to update app language:", error);
    });
  };

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      isReady,
    }),
    [isReady, language]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }

  return context;
}
