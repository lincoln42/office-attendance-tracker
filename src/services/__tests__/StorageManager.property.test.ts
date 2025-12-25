import { StorageManager } from '../StorageManager';
import * as fc from 'fast-check';

/**
 * Feature: office-attendance-tracker, Property 4: Comprehensive data persistence
 * Validates: Requirements 1.5, 2.4, 4.4, 6.2
 */
describe('StorageManager Property Tests', () => {
  let originalLocalStorage: Storage;

  beforeAll(() => {
    originalLocalStorage = (global as any).localStorage;
  });

  afterAll(() => {
    (global as any).localStorage = originalLocalStorage;
  });

  beforeEach(() => {
    // Ensure each test starts with fresh storage
    (global as any).localStorage = createFreshMockStorage();
  });

  function createFreshMockStorage(): Storage {
    const mockStorage: { [key: string]: string } = {};

    return {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, value: string) => {
        mockStorage[key] = value;
      },
      removeItem: (key: string) => {
        delete mockStorage[key];
      },
      clear: () => {
        Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
      },
      key: (index: number) => {
        const keys = Object.keys(mockStorage);
        return keys[index] || null;
      },
      get length() {
        return Object.keys(mockStorage).length;
      }
    } as Storage;
  }

  /**
   * Feature: office-attendance-tracker, Property 4: Comprehensive data persistence
   * Validates: Requirements 1.5, 2.4, 4.4, 6.2
   */
  test('Property 4: Any data saved should be retrievable immediately', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }), // key
        fc.oneof(
          fc.string(),
          fc.integer(),
          fc.boolean(),
          fc.array(fc.string()),
          fc.record({
            location: fc.string(),
            year: fc.integer({ min: 2020, max: 2030 }),
            inOfficePercentage: fc.integer({ min: 0, max: 100 })
          })
        ), // various data types
        (key, data) => {
          const storageManager = new StorageManager();

          // Save the data
          storageManager.save(key, data);

          // Retrieve the data
          const retrieved = storageManager.load(key);

          // The retrieved data should equal the saved data
          expect(retrieved).toEqual(data);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: office-attendance-tracker, Property 5: Session data restoration
   * Validates: Requirements 1.7, 2.5, 4.5, 6.1
   */
  test('Property 5: Data should persist across StorageManager instances', () => {
    // Create fresh storage for this entire test
    (global as any).localStorage = createFreshMockStorage();

    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.record({
          configuration: fc.record({
            location: fc.constantFrom('UK', 'US', 'Mexico'),
            year: fc.integer({ min: 2020, max: 2030 }),
            inOfficePercentage: fc.integer({ min: 0, max: 100 })
          }),
          attendanceData: fc.record({
            [fc.integer({ min: 2020, max: 2030 }).toString()]: fc.record({
              [fc.integer({ min: 1, max: 12 }).toString()]: fc.record({
                [fc.integer({ min: 1, max: 31 }).toString()]: fc.boolean()
              })
            })
          }),
          annualLeaveData: fc.record({
            [fc.integer({ min: 2020, max: 2030 }).toString()]: fc.record({
              [fc.integer({ min: 1, max: 12 }).toString()]: fc.integer({ min: 0, max: 31 })
            })
          })
        }),
        (key, userData) => {
          // Save data with first instance
          const firstManager = new StorageManager();
          firstManager.save(key, userData);

          // Create new instance and retrieve data (same storage)
          const secondManager = new StorageManager();
          const retrieved = secondManager.load(key);

          // Data should be the same
          expect(retrieved).toEqual(userData);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: office-attendance-tracker, Property 18: Browser session persistence
   * Validates: Requirements 6.3
   */
  test('Property 18: Data should survive storage manager recreation', () => {
    // Create fresh storage for this entire test
    (global as any).localStorage = createFreshMockStorage();

    fc.assert(
      fc.property(
        fc.uniqueArray(
          fc.record({
            key: fc.string({ minLength: 1, maxLength: 20 }),
            data: fc.oneof(
              fc.string(),
              fc.integer(),
              fc.boolean(),
              fc.record({
                location: fc.constantFrom('UK', 'US', 'Mexico'),
                year: fc.integer({ min: 2020, max: 2030 }),
                inOfficePercentage: fc.integer({ min: 0, max: 100 })
              })
            )
          }),
          { minLength: 1, maxLength: 10, selector: (item) => item.key }
        ),
        (dataEntries) => {
          // Save multiple entries
          const manager1 = new StorageManager();
          dataEntries.forEach(({ key, data }) => {
            manager1.save(key, data);
          });

          // Simulate browser session restart by creating new manager (same storage)
          const manager2 = new StorageManager();

          // All data should still be retrievable
          dataEntries.forEach(({ key, data }) => {
            const retrieved = manager2.load(key);
            expect(retrieved).toEqual(data);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property: Non-existent keys should return null', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(key => key.trim().length > 0),
        (key) => {
          // Create completely fresh empty storage for each iteration
          const freshStorage = createFreshMockStorage();
          (global as any).localStorage = freshStorage;
          const storageManager = new StorageManager();

          // Ensure the key doesn't exist by using a unique prefix
          const uniqueKey = `__test_nonexistent_${Date.now()}_${Math.random()}_${key}`;

          const result = storageManager.load(uniqueKey);
          expect(result).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property: Clear should remove all application data', () => {
    // Create fresh storage for this entire test
    (global as any).localStorage = createFreshMockStorage();

    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            key: fc.string({ minLength: 1, maxLength: 20 }),
            data: fc.string()
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (dataEntries) => {
          const storageManager = new StorageManager();

          // Save multiple entries
          dataEntries.forEach(({ key, data }) => {
            storageManager.save(key, data);
          });

          // Clear storage
          storageManager.clear();

          // All entries should be gone
          dataEntries.forEach(({ key }) => {
            const retrieved = storageManager.load(key);
            expect(retrieved).toBeNull();
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});