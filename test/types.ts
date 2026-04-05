/**
 * Shared type definitions for E2E tests.
 * Ensures type-safe responses throughout all test suites.
 */

export interface ApiErrorResponse {
  code: string;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiErrorResponse;
}

// ============================================================================
// AUTH TYPES
// ============================================================================

export interface SafeUser {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'ANALYST' | 'VIEWER';
  status: 'ACTIVE' | 'INACTIVE';
  password?: never; // Explicitly exclude password from safe responses
}

export interface SafeUserWithTimestamp extends SafeUser {
  updatedAt: string;
}

export interface AuthResponseData {
  token: string;
  user: SafeUser | SafeUserWithTimestamp;
}

// ============================================================================
// USERS TYPES
// ============================================================================

export interface UserData extends SafeUser {
  password?: never; // Ensure password is never present in response
}

export interface PaginatedUsers {
  data: UserData[];
  total: number;
}

// ============================================================================
// RECORDS TYPES
// ============================================================================

export interface RecordUserInfo {
  id: number;
  name: string;
  email: string;
}

export interface RecordData {
  id: number;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  notes?: string;
  date?: string;
  user?: RecordUserInfo;
}

export interface PaginatedRecords {
  data: RecordData[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// DASHBOARD TYPES
// ============================================================================

export interface DashboardTotalResponse {
  totalIncome: number;
}

export interface DashboardExpenseResponse {
  totalExpense: number;
}

export interface DashboardBalanceResponse {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
}

export interface CategorySummary {
  [key: string]: number;
}

export interface RecentTransactionsResponse {
  data: RecordData[];
}

export interface MonthlyTrendItem {
  month: string; // YYYY-MM format
  income: number;
  expense: number;
}

// ============================================================================
// TYPE GUARDS & HELPERS
// ============================================================================

/**
 * Asserts that data exists and is of type T.
 * Throws an error with a descriptive message if not.
 */
export function assertDataExists<T>(
  response: ApiResponse<T>,
  context: string,
): asserts response is ApiResponse<T> & { data: T } {
  if (!response.data) {
    throw new Error(
      `Expected data in response for ${context}, got: ${JSON.stringify(response)}`,
    );
  }
}

/**
 * Extracts and validates typed data from an API response.
 * Ensures the response has valid data before returning it.
 */
export function getResponseData<T>(
  response: ApiResponse<T>,
  context: string,
): T {
  assertDataExists(response, context);
  return response.data;
}

/**
 * Type guard for checking if a response is an auth response.
 */
export function isAuthResponse(data: unknown): data is AuthResponseData {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.token === 'string' &&
    typeof obj.user === 'object' &&
    obj.user !== null &&
    typeof (obj.user as Record<string, unknown>).id === 'number'
  );
}

/**
 * Type guard for checking if a value is a PaginatedRecords response.
 */
export function isPaginatedRecords(data: unknown): data is PaginatedRecords {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    Array.isArray(obj.data) &&
    typeof obj.total === 'number' &&
    typeof obj.page === 'number' &&
    typeof obj.limit === 'number' &&
    typeof obj.totalPages === 'number'
  );
}

/**
 * Type guard for checking if a value is a PaginatedUsers response.
 */
export function isPaginatedUsers(data: unknown): data is PaginatedUsers {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return Array.isArray(obj.data) && typeof obj.total === 'number';
}

/**
 * Type guard for checking if a value is a DashboardBalanceResponse.
 */
export function isDashboardBalanceResponse(
  data: unknown,
): data is DashboardBalanceResponse {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.totalIncome === 'number' &&
    typeof obj.totalExpense === 'number' &&
    typeof obj.netBalance === 'number'
  );
}

/**
 * Type guard for checking if a value is a MonthlyTrendItem array.
 */
export function isMonthlyTrendArray(data: unknown): data is MonthlyTrendItem[] {
  if (!Array.isArray(data)) return false;
  return data.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as Record<string, unknown>).month === 'string' &&
      typeof (item as Record<string, unknown>).income === 'number' &&
      typeof (item as Record<string, unknown>).expense === 'number',
  );
}
