import type { Registry, RegistryTemplate } from './types.js';

/**
 * Validate if template object conforms to RegistryTemplate format
 */
function isValidTemplate(template: unknown): template is RegistryTemplate {
  if (!template || typeof template !== 'object') {
    return false;
  }

  const t = template as Record<string, unknown>;

  // Check required fields
  if (typeof t.id !== 'string' || !t.id.trim()) {
    return false;
  }

  if (typeof t.path !== 'string' || !t.path.trim()) {
    return false;
  }

  if (typeof t.title !== 'string' || !t.title.trim()) {
    return false;
  }

  // Check optional fields
  if (t.description !== undefined && typeof t.description !== 'string') {
    return false;
  }

  return true;
}

/**
 * Validate if data is a valid Registry
 * @param data - Data to validate
 * @returns Returns true if valid
 */
export function isValidRegistry(data: unknown): boolean {
  try {
    validateRegistry(data);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate and return Registry object, throws error if validation fails
 * @param data - Data to validate
 * @returns Validated Registry object
 * @throws {Error} Throws error with detailed message when validation fails
 */
export function validateRegistry(data: unknown): Registry {
  // Basic type check
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Registry must be an object');
  }

  const registry = data as Record<string, unknown>;

  // Validate repo field
  if (typeof registry.repo !== 'string' || !registry.repo.trim()) {
    throw new Error('Registry is missing required field "repo"');
  }

  // Validate defaultRef field
  if (typeof registry.defaultRef !== 'string' || !registry.defaultRef.trim()) {
    throw new Error('Registry is missing required field "defaultRef"');
  }

  // Validate templates field
  if (!Array.isArray(registry.templates)) {
    throw new Error(
      'Registry is missing required field "templates" or its value is invalid (must be an array)',
    );
  }

  if (registry.templates.length === 0) {
    throw new Error('Registry "templates" array cannot be empty');
  }

  // Validate each template
  const templateIds = new Set<string>();
  registry.templates.forEach((template, index) => {
    if (!isValidTemplate(template)) {
      throw new Error(`Registry templates[${index}] format is invalid`);
    }

    const t = template;

    // Check for duplicate id
    if (templateIds.has(t.id)) {
      throw new Error(`Registry templates contain duplicate id: "${t.id}"`);
    }
    templateIds.add(t.id);
  });

  // Validate optional field types
  if (registry.name !== undefined && typeof registry.name !== 'string') {
    throw new Error('Registry "name" field must be a string');
  }

  if (registry.description !== undefined && typeof registry.description !== 'string') {
    throw new Error('Registry "description" field must be a string');
  }

  if (registry.version !== undefined && typeof registry.version !== 'string') {
    throw new Error('Registry "version" field must be a string');
  }

  // Return validated Registry object
  return {
    repo: registry.repo,
    defaultRef: registry.defaultRef,
    templates: registry.templates as RegistryTemplate[],
    name: registry.name,
    description: registry.description,
    version: registry.version,
  };
}
