import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./resources/en";
import zh from "./resources/zh";

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    zh: { translation: zh },
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
  returnNull: false,
});

export default i18n;
