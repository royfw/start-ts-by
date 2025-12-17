/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs/promises';
import http from 'node:http';
import https from 'node:https';
import { loadRegistryFromUrl, loadRegistryFromFile } from './loader.js';

// Mock modules
vi.mock('node:fs/promises');
vi.mock('node:http');
vi.mock('node:https');

describe('loader', () => {
  describe('loadRegistryFromFile', () => {
    const validRegistryContent = JSON.stringify({
      repo: 'https://github.com/user/repo',
      defaultRef: 'main',
      templates: [
        {
          id: 'template-1',
          path: 'templates/template-1',
          title: 'Template 1',
        },
      ],
    });

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should successfully load valid local registry file', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(validRegistryContent);

      const result = await loadRegistryFromFile('/path/to/registry.json');

      expect(result).toEqual({
        repo: 'https://github.com/user/repo',
        defaultRef: 'main',
        templates: [
          {
            id: 'template-1',
            path: 'templates/template-1',
            title: 'Template 1',
          },
        ],
      });
      expect(fs.readFile).toHaveBeenCalledWith('/path/to/registry.json', 'utf-8');
    });

    it('should reject empty string path', async () => {
      await expect(loadRegistryFromFile('')).rejects.toThrow(
        'File path must be a non-empty string',
      );
    });

    it('should reject non-string path', async () => {
      // @ts-expect-error - testing invalid input
      await expect(loadRegistryFromFile(null)).rejects.toThrow(
        'File path must be a non-empty string',
      );
    });

    it('should handle file not found error', async () => {
      const error = new Error('ENOENT') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      vi.mocked(fs.readFile).mockRejectedValue(error);

      await expect(loadRegistryFromFile('/path/to/nonexistent.json')).rejects.toThrow(
        'File not found: /path/to/nonexistent.json',
      );
    });

    it('should handle permission denied error', async () => {
      const error = new Error('EACCES') as NodeJS.ErrnoException;
      error.code = 'EACCES';
      vi.mocked(fs.readFile).mockRejectedValue(error);

      await expect(loadRegistryFromFile('/path/to/registry.json')).rejects.toThrow(
        'Permission denied to read file: /path/to/registry.json',
      );
    });

    it('should handle JSON parsing error', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('invalid json');

      await expect(loadRegistryFromFile('/path/to/registry.json')).rejects.toThrow(
        'JSON parsing error',
      );
    });

    it('should handle validation error', async () => {
      const invalidRegistry = JSON.stringify({
        repo: 'https://github.com/user/repo',
        // missing defaultRef
        templates: [],
      });
      vi.mocked(fs.readFile).mockResolvedValue(invalidRegistry);

      await expect(loadRegistryFromFile('/path/to/registry.json')).rejects.toThrow();
    });
  });

  describe('loadRegistryFromUrl', () => {
    const validRegistryContent = JSON.stringify({
      repo: 'https://github.com/user/repo',
      defaultRef: 'main',
      templates: [
        {
          id: 'template-1',
          path: 'templates/template-1',
          title: 'Template 1',
        },
      ],
    });

    beforeEach(() => {
      vi.clearAllMocks();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should reject empty string URL', async () => {
      await expect(loadRegistryFromUrl('')).rejects.toThrow(
        'URL must be a non-empty string',
      );
    });

    it('should reject non-string URL', async () => {
      // @ts-expect-error - testing invalid input
      await expect(loadRegistryFromUrl(null)).rejects.toThrow(
        'URL must be a non-empty string',
      );
    });

    it('should reject invalid URL format', async () => {
      await expect(loadRegistryFromUrl('not-a-url')).rejects.toThrow(
        'Invalid URL format: not-a-url',
      );
    });

    it('should reject unsupported protocol', async () => {
      await expect(
        loadRegistryFromUrl('ftp://example.com/registry.json'),
      ).rejects.toThrow('Unsupported protocol: ftp:, only http and https are supported');
    });

    it('should successfully load HTTPS URL', async () => {
      const mockRequest = {
        on: vi.fn((event, _callback) => {
          if (event === 'error') {
            // do nothing
          }
          return mockRequest;
        }),
        setTimeout: vi.fn(),
      };

      const mockResponse = {
        statusCode: 200,
        on: vi.fn((event, callback) => {
          if (event === 'data') {
            callback(validRegistryContent);
          } else if (event === 'end') {
            callback();
          }
          return mockResponse;
        }),
      };

      vi.mocked(https.get).mockImplementation(((url: any, _callback: any) => {
        if (typeof _callback === 'function') {
          _callback(mockResponse as any);
        }
        return mockRequest as any;
      }) as any);

      const result = await loadRegistryFromUrl('https://example.com/registry.json');

      expect(result).toEqual({
        repo: 'https://github.com/user/repo',
        defaultRef: 'main',
        templates: [
          {
            id: 'template-1',
            path: 'templates/template-1',
            title: 'Template 1',
          },
        ],
      });
    });

    it('should successfully load HTTP URL', async () => {
      const mockRequest = {
        on: vi.fn((event, _callback) => {
          if (event === 'error') {
            // do nothing
          }
          return mockRequest;
        }),
        setTimeout: vi.fn(),
      };

      const mockResponse = {
        statusCode: 200,
        on: vi.fn((event, callback) => {
          if (event === 'data') {
            callback(validRegistryContent);
          } else if (event === 'end') {
            callback();
          }
          return mockResponse;
        }),
      };

      vi.mocked(http.get).mockImplementation(((url: any, _callback: any) => {
        if (typeof _callback === 'function') {
          _callback(mockResponse as any);
        }
        return mockRequest as any;
      }) as any);

      const result = await loadRegistryFromUrl('http://example.com/registry.json');

      expect(result).toEqual({
        repo: 'https://github.com/user/repo',
        defaultRef: 'main',
        templates: [
          {
            id: 'template-1',
            path: 'templates/template-1',
            title: 'Template 1',
          },
        ],
      });
    });

    it('should handle HTTP error status code', async () => {
      const mockRequest = {
        on: vi.fn((event, _callback) => {
          if (event === 'error') {
            // do nothing
          }
          return mockRequest;
        }),
        setTimeout: vi.fn(),
      };

      const mockResponse = {
        statusCode: 404,
        on: vi.fn(),
      };

      vi.mocked(https.get).mockImplementation(((url: any, _callback: any) => {
        if (typeof _callback === 'function') {
          _callback(mockResponse as any);
        }
        return mockRequest as any;
      }) as any);

      await expect(
        loadRegistryFromUrl('https://example.com/registry.json'),
      ).rejects.toThrow('HTTP request failed with status code: 404');
    });

    it('should handle network error', async () => {
      const mockRequest = {
        on: vi.fn((event, callback) => {
          if (event === 'error') {
            callback(new Error('Network error'));
          }
          return mockRequest;
        }),
        setTimeout: vi.fn(),
      };

      vi.mocked(https.get).mockImplementation(() => {
        return mockRequest as any;
      });

      await expect(
        loadRegistryFromUrl('https://example.com/registry.json'),
      ).rejects.toThrow('Network request failed: Network error');
    });

    it('should handle JSON parsing error', async () => {
      const mockRequest = {
        on: vi.fn((event, _callback) => {
          if (event === 'error') {
            // do nothing
          }
          return mockRequest;
        }),
        setTimeout: vi.fn(),
      };

      const mockResponse = {
        statusCode: 200,
        on: vi.fn((event, callback) => {
          if (event === 'data') {
            callback('invalid json');
          } else if (event === 'end') {
            callback();
          }
          return mockResponse;
        }),
      };

      vi.mocked(https.get).mockImplementation(((url: any, _callback: any) => {
        if (typeof _callback === 'function') {
          _callback(mockResponse as any);
        }
        return mockRequest as any;
      }) as any);

      await expect(
        loadRegistryFromUrl('https://example.com/registry.json'),
      ).rejects.toThrow('JSON parsing error');
    });
  });
});
