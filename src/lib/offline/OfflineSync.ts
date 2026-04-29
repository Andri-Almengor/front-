import React from "react";
import NetInfo from "@react-native-community/netinfo";
import { AppState, type AppStateStatus } from "react-native";
import { offlineDownloadManager } from "./DownloadManager";

export function OfflineSync() {
  React.useEffect(() => {
    void offlineDownloadManager.init();

    const netUnsub = NetInfo.addEventListener((state) => {
      const online = !!state.isConnected && !!state.isInternetReachable;
      void offlineDownloadManager.setOnline(online);
    });

    const appSub = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      if (nextState === "active") {
        void offlineDownloadManager.resumePaused();
        void offlineDownloadManager.init();
      } else if (nextState === "inactive" || nextState === "background") {
        void offlineDownloadManager.pauseActive();
      }
    });

    return () => {
      netUnsub();
      appSub.remove();
    };
  }, []);

  return null;
}