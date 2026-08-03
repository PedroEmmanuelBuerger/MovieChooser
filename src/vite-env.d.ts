/// <reference types="vite/client" />

import type { ElectronAPI } from "./types/electron";

interface ImportMetaEnv {
  readonly VITE_TMDB_API_KEY?: string;
  readonly VITE_TMDB_BASE_URL?: string;
  readonly VITE_DEV_SERVER_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
