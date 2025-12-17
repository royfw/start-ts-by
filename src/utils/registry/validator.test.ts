import { describe, it, expect } from 'vitest';
import { validateRegistry, isValidRegistry } from './validator.js';

describe('validator', () => {
  describe('validateRegistry', () => {
    it('should accept valid registry format', () => {
      const validRegistry = {
        repo: 'https://github.com/user/repo',
        defaultRef: 'main',
        templates: [
          {
            id: 'template-1',
            path: 'templates/template-1',
            title: 'Template 1',
          },
        ],
      };

      const result = validateRegistry(validRegistry);
      expect(result).toEqual(validRegistry);
    });

    it('should accept registry with optional fields', () => {
      const validRegistry = {
        repo: 'https://github.com/user/repo',
        defaultRef: 'main',
        name: 'My Registry',
        description: 'A test registry',
        version: '1.0.0',
        templates: [
          {
            id: 'template-1',
            path: 'templates/template-1',
            title: 'Template 1',
            description: 'Description for template 1',
          },
        ],
      };

      const result = validateRegistry(validRegistry);
      expect(result).toEqual(validRegistry);
    });

    it('should accept multiple templates', () => {
      const validRegistry = {
        repo: 'https://github.com/user/repo',
        defaultRef: 'main',
        templates: [
          {
            id: 'template-1',
            path: 'templates/template-1',
            title: 'Template 1',
          },
          {
            id: 'template-2',
            path: 'templates/template-2',
            title: 'Template 2',
          },
        ],
      };

      const result = validateRegistry(validRegistry);
      expect(result.templates).toHaveLength(2);
    });

    it('should reject non-object types', () => {
      expect(() => validateRegistry(null)).toThrow('Registry must be an object');
      expect(() => validateRegistry(undefined)).toThrow('Registry must be an object');
      expect(() => validateRegistry('string')).toThrow('Registry must be an object');
      expect(() => validateRegistry(123)).toThrow('Registry must be an object');
      expect(() => validateRegistry([])).toThrow('Registry must be an object');
    });

    it('should reject missing repo field', () => {
      const invalidRegistry = {
        defaultRef: 'main',
        templates: [
          {
            id: 'template-1',
            path: 'templates/template-1',
            title: 'Template 1',
          },
        ],
      };

      expect(() => validateRegistry(invalidRegistry)).toThrow(
        'Registry is missing required field "repo"',
      );
    });

    it('should reject empty repo field', () => {
      const invalidRegistry = {
        repo: '   ',
        defaultRef: 'main',
        templates: [
          {
            id: 'template-1',
            path: 'templates/template-1',
            title: 'Template 1',
          },
        ],
      };

      expect(() => validateRegistry(invalidRegistry)).toThrow(
        'Registry is missing required field "repo"',
      );
    });

    it('should reject missing defaultRef field', () => {
      const invalidRegistry = {
        repo: 'https://github.com/user/repo',
        templates: [
          {
            id: 'template-1',
            path: 'templates/template-1',
            title: 'Template 1',
          },
        ],
      };

      expect(() => validateRegistry(invalidRegistry)).toThrow(
        'Registry is missing required field "defaultRef"',
      );
    });

    it('should reject missing templates field', () => {
      const invalidRegistry = {
        repo: 'https://github.com/user/repo',
        defaultRef: 'main',
      };

      expect(() => validateRegistry(invalidRegistry)).toThrow(
        'Registry is missing required field "templates"',
      );
    });

    it('should reject empty templates array', () => {
      const invalidRegistry = {
        repo: 'https://github.com/user/repo',
        defaultRef: 'main',
        templates: [],
      };

      expect(() => validateRegistry(invalidRegistry)).toThrow(
        'Registry "templates" array cannot be empty',
      );
    });

    it('should reject templates not being an array', () => {
      const invalidRegistry = {
        repo: 'https://github.com/user/repo',
        defaultRef: 'main',
        templates: 'not-an-array',
      };

      expect(() => validateRegistry(invalidRegistry)).toThrow(
        'Registry is missing required field "templates" or its value is invalid (must be an array)',
      );
    });

    it('should reject template missing id field', () => {
      const invalidRegistry = {
        repo: 'https://github.com/user/repo',
        defaultRef: 'main',
        templates: [
          {
            path: 'templates/template-1',
            title: 'Template 1',
          },
        ],
      };

      expect(() => validateRegistry(invalidRegistry)).toThrow(
        'Registry templates[0] format is invalid',
      );
    });

    it('should reject template missing path field', () => {
      const invalidRegistry = {
        repo: 'https://github.com/user/repo',
        defaultRef: 'main',
        templates: [
          {
            id: 'template-1',
            title: 'Template 1',
          },
        ],
      };

      expect(() => validateRegistry(invalidRegistry)).toThrow(
        'Registry templates[0] format is invalid',
      );
    });

    it('should reject template missing title field', () => {
      const invalidRegistry = {
        repo: 'https://github.com/user/repo',
        defaultRef: 'main',
        templates: [
          {
            id: 'template-1',
            path: 'templates/template-1',
          },
        ],
      };

      expect(() => validateRegistry(invalidRegistry)).toThrow(
        'Registry templates[0] format is invalid',
      );
    });

    it('should reject duplicate template id', () => {
      const invalidRegistry = {
        repo: 'https://github.com/user/repo',
        defaultRef: 'main',
        templates: [
          {
            id: 'template-1',
            path: 'templates/template-1',
            title: 'Template 1',
          },
          {
            id: 'template-1',
            path: 'templates/template-2',
            title: 'Template 2',
          },
        ],
      };

      expect(() => validateRegistry(invalidRegistry)).toThrow(
        'Registry templates contain duplicate id: "template-1"',
      );
    });

    it('should reject invalid optional field types', () => {
      const invalidName = {
        repo: 'https://github.com/user/repo',
        defaultRef: 'main',
        name: 123,
        templates: [
          {
            id: 'template-1',
            path: 'templates/template-1',
            title: 'Template 1',
          },
        ],
      };

      expect(() => validateRegistry(invalidName)).toThrow(
        'Registry "name" field must be a string',
      );

      const invalidDescription = {
        repo: 'https://github.com/user/repo',
        defaultRef: 'main',
        description: 123,
        templates: [
          {
            id: 'template-1',
            path: 'templates/template-1',
            title: 'Template 1',
          },
        ],
      };

      expect(() => validateRegistry(invalidDescription)).toThrow(
        'Registry "description" field must be a string',
      );

      const invalidVersion = {
        repo: 'https://github.com/user/repo',
        defaultRef: 'main',
        version: 123,
        templates: [
          {
            id: 'template-1',
            path: 'templates/template-1',
            title: 'Template 1',
          },
        ],
      };

      expect(() => validateRegistry(invalidVersion)).toThrow(
        'Registry "version" field must be a string',
      );
    });
  });

  describe('isValidRegistry', () => {
    it('should return true for valid registry', () => {
      const validRegistry = {
        repo: 'https://github.com/user/repo',
        defaultRef: 'main',
        templates: [
          {
            id: 'template-1',
            path: 'templates/template-1',
            title: 'Template 1',
          },
        ],
      };

      expect(isValidRegistry(validRegistry)).toBe(true);
    });

    it('should return false for invalid registry', () => {
      const invalidRegistry = {
        defaultRef: 'main',
        templates: [],
      };

      expect(isValidRegistry(invalidRegistry)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isValidRegistry(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isValidRegistry(undefined)).toBe(false);
    });
  });
});
