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
