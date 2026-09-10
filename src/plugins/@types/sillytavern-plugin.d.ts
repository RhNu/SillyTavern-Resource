/**
 * SillyTavern 服务端插件的最小类型定义。
 *
 * 插件模块导出 info / init / exit, 由 SillyTavern 的 src/plugin-loader.js 动态加载:
 * - 插件文件放在 SillyTavern 根目录的 plugins/ 文件夹, 需在 config.yaml 开启 enableServerPlugins: true
 * - init 收到的 router 是 SillyTavern 创建的 Express Router, 路由会挂载到 /api/plugins/{id}/ 下
 * - 产物使用 .cjs 扩展名, 保证在 SillyTavern 的 "type": "module" 环境下仍按 CommonJS 解析;
 *   动态 import() 一个 CJS 文件时返回 { default: module.exports }, loader 兼容 plugin.default?.init
 */

/** 插件请求对象 (Express Request 的子集) */
export interface PluginRequest {
  body: Record<string, unknown>;
  query: Record<string, unknown>;
  params: Record<string, string>;
  user: {
    profile: { handle: string; admin: boolean };
    directories: UserDirectoryList;
  };
  once(event: 'aborted', listener: () => void): this;
  removeListener(event: 'aborted', listener: () => void): this;
}

export interface UserDirectoryList {
  root: string;
  backups: string;
  [name: string]: string;
}

/** 插件响应对象 (Express Response 的子集) */
export interface PluginResponse {
  status(code: number): PluginResponse;
  json(body: unknown): void;
  send(body?: unknown): void;
  sendStatus(code: number): void;
  set(field: string, value: string): PluginResponse;
}

/** 插件路由 (Express Router 的子集) */
export interface PluginRouter {
  get(path: string, handler: (req: PluginRequest, res: PluginResponse) => unknown): void;
  post(path: string, handler: (req: PluginRequest, res: PluginResponse) => unknown): void;
  use(...args: unknown[]): void;
}

export interface PluginInfo {
  id: string;
  name: string;
  description: string;
}

export type PluginInit = (router: PluginRouter) => Promise<void> | void;
export type PluginExit = () => Promise<void> | void;
