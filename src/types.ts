import { CommandOptions } from 'commander';

export type ParsedTemplateType = {
  repoUrl: string;
  ref: string;
  subdir: string;
  isGithub: boolean;
  isLocal: boolean;
};

export type ActionArgsType = {
  [key: string]: string | string[] | boolean | undefined;
};

export type OptionsType = {
  [key: string]: string | number | boolean | undefined;
};

export type PackageJsonType = {
  name: string;
  version: string;
  description: string;
  [key: string]: string | number | boolean | undefined;
};

export type TemplateInfoType = {
  name: string;
  repo: string;
};

export type ProjectConfigType = {
  name: string;
  version: string;
  description: string;
  templates: TemplateInfoType[];
  packageJson: PackageJsonType;
};

export type FlagsOptionType = {
  flags: string;
  description: string;
  defaultValue?: string | boolean | string[];
};

export type ActionCommandType = {
  name: string;
  description: string;
  flagsOptions: FlagsOptionType[];
  action: (name?: string, actionArgs?: ActionArgsType) => Promise<void>;
  commandOptions?: CommandOptions;
};

export type RemoveFileInfoType = {
  field: string;
  isRemove: boolean;
};

export type RnuExecInfoType = {
  key: string;
  command: string;
  isExec: boolean;
};

export type CreateProjectParams = {
  name: string;
  template: string;
  removeList: RemoveFileInfoType[];
  execList: RnuExecInfoType[];
  isMonorepo?: boolean;
};

export type PromptCheckArgsType = {
  key: string;
  message: string;
};

// Variable parsing related types
export type ParsedVarsType = {
  [key: string]: string | number | boolean | ParsedVarsType | ParsedVarsType[];
};

export type VarsParseResult = {
  vars: ParsedVarsType;
  errors: string[];
};

export type VarsFileInclude = {
  path: string;
  includedFrom?: string;
};

export type VarsMergeOptions = {
  strict?: boolean;
};

export type VarsMergeResult = {
  merged: ParsedVarsType;
  warnings: string[];
  errors: string[];
};

// Extended ActionArgsType for non-interactive mode support
export type ExtendedActionArgsType = ActionArgsType & {
  noInteraction?: boolean;
  ni?: boolean;
  yes?: boolean;
  y?: boolean;
  vars?: string[];
  varsFile?: string;
  strict?: boolean;
};

// Registry related types
export interface RegistryTemplate {
  id: string;
  path: string;
  title: string;
  description?: string;
}

export interface Registry {
  repo: string;
  defaultRef: string;
  templates: RegistryTemplate[];
  name?: string;
  description?: string;
  version?: string;
}

export interface RegistrySource {
  name: string;
  url: string;
  enabled?: boolean;
}

export interface RegistryConfig {
  registries: RegistrySource[];
  cacheDir?: string;
  cacheTTL?: number;
}

export interface ResolvedTemplate {
  source: 'builtin' | 'registry' | 'manual';
  registryName?: string;
  template: RegistryTemplate | string;
  fullUrl?: string;
}
