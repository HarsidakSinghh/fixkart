import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing, shadow } from "../theme";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({ visible: false, message: "", tone: "info" });

  const show = useCallback((message, tone = "info") => {
    setToast({ visible: true, message, tone });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 2000);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast.visible ? (
        <View style={[styles.toast, shadow.soft, toneStyle(toast.tone)]}>
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}

function toneStyle(tone) {
  if (tone === "success") return styles.toastSuccess;
  if (tone === "error") return styles.toastError;
  return styles.toastInfo;
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xl,
    backgroundColor: colors.panel,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.line,
  },
  toastText: { color: colors.text, fontWeight: "700", textAlign: "center" },
  toastSuccess: { borderColor: colors.success },
  toastError: { borderColor: colors.danger },
  toastInfo: { borderColor: colors.info },
});
