import React, { createContext, ReactNode, useContext, useState } from "react";

interface LicenseContextType {
  isActivated: boolean;
  showActivationModal: boolean;
  setShowActivationModal: (show: boolean) => void;
  activateLicense: (key: string) => Promise<boolean>;
  isActivating: boolean;
}

const LicenseContext = createContext<LicenseContextType | undefined>(undefined);

export function LicenseProvider({ children }: { children: ReactNode }) {
  const [isActivated, setIsActivated] = useState(false);
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  const activateLicense = async (key: string): Promise<boolean> => {
    setIsActivating(true);
    // TODO: 实际验证激活码的API调用
    return new Promise((resolve) => {
      setTimeout(() => {
        setIsActivating(false);
        // 模拟：激活码长度>=16则激活成功
        if (key.trim().length >= 16) {
          setIsActivated(true);
          setShowActivationModal(false);
          resolve(true);
        } else {
          resolve(false);
        }
      }, 1500);
    });
  };

  return (
    <LicenseContext.Provider
      value={{
        isActivated,
        showActivationModal,
        setShowActivationModal,
        activateLicense,
        isActivating,
      }}
    >
      {children}
    </LicenseContext.Provider>
  );
}

export function useLicense() {
  const context = useContext(LicenseContext);
  if (context === undefined) {
    throw new Error("useLicense must be used within a LicenseProvider");
  }
  return context;
}

