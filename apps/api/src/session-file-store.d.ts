declare module "session-file-store" {
  import session from "express-session";

  interface FileStoreOptions {
    path?: string;
    ttl?: number;
    retries?: number;
    factor?: number;
    minTimeout?: number;
    maxTimeout?: number;
    reapInterval?: number;
    reapAsync?: boolean;
    reapSyncFallback?: boolean;
    logFn?: (...args: unknown[]) => void;
    fallbackSessionFn?: () => session.SessionData;
    secret?: string;
    encoder?: unknown;
    encoding?: string;
    fileExtension?: string;
  }

  function FileStoreFactory(
    session: typeof import("express-session")
  ): new (options?: FileStoreOptions) => session.Store;

  export default FileStoreFactory;
}
