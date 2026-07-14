/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PORT_CLIENT: number;
  readonly VITE_PORT_SERVER: number;
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}