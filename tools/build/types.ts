export type BuildMode = 'production' | 'development';
export type BuildKind = 'scripts' | 'plugins';
export type ProjectKind = 'frontend' | 'script' | 'plugin';

export interface BuildContext {
  mode: BuildMode;
  isProduction: boolean;
  verbose: boolean;
}

export interface Project {
  area: BuildKind;
  kind: ProjectKind;
  name: string;
  projectKey: string;
  relativeDir: string;
  projectRoot: string;
  entryFile: string;
  htmlEntry: string | null;
  finalOutputDir: string;
  stagingOutputDir: string;
}

export interface BuildOptions {
  mode: BuildMode;
  kinds: BuildKind[];
  targets: string[];
  verbose: boolean;
  useCache: boolean;
  clearCache: boolean;
  watch: boolean;
  help: boolean;
}

export interface ManifestEntry {
  projectKey: string;
  kind: ProjectKind;
  mode: BuildMode;
  inputHash: string;
  outputDir: string;
  outputFiles: string[];
  builtAt: string;
}

export interface BuildManifest {
  version: number;
  projects: Record<string, ManifestEntry>;
}

export interface Logger {
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
}
