# Design Document — HisabKitab App Build

## Overview

HisabKitab is a shared expense tracker built with Expo 57 / React Native 0.86. The codebase already has authentication, navigation, and API layers in place. This build spec covers the remaining work: a properly styled `AppHeader`, a global `expenseStore`, and four fully implemented dashboard screens (Overview, Purchases, Settlement, Settlement Logs).

All styling uses NativeWind v4 (TailwindCSS class strings). Design tokens come from `src/constants/colors.ts`. Navigation is a `ProtectedStack → ProtectedTabs` structure with four bottom tabs.

### Key Design Goals

- **Minimal prop drilling** — shared expense state lives in a single Zustand store; screens read directly from it.
- **Optimistic list updates** — `addExpense` prepends immediately so the user sees their new row without a full re-fetch.
- **Consistent loading / error UX** — every data-fetching screen uses the same three-state pattern: loading → data / empty → error + retry.
- **Safe-area awareness** — `AppHeader` carries its own top inset; screen root views carry bottom inset so nothing is hidden behind the tab bar or home indicator.

---

## Architecture

```
App.tsx
 └─ <StatusBar />
 └─ <AppNavigator />          ← NavigationContainer
      └─ ProtectedStack (headerShown:false)
           └─ ProtectedTabs (headerShown:false on every tab screen)
                ├─ OverviewScreen
                │    └─ <AppHeader title="Overview" />
                │    └─ <ScrollView> KPI cards + BarChart
                ├─ PurchasesScreen
                │    └─ <AppHeader title="Purchases" />
                │    └─ <FlatList expenses />
                │    └─ <FAB />  →  <AddExpenseModal />
                │    └─ <ExpenseDetailSheet />
                ├─ SettlementScreen
                │    └─ <AppHeader title="Settlement" />
                │    └─ preview → transactions list + balance table
                │    └─ "Settle Now" button
                └─ SettlementLogsScreen
                      └─ <AppHeader title="Logs" />
                      └─ <FlatList settlements /> accordion rows
 └─ <Toast />                 ← mounted at root, above navigator
```

### State architecture

```
authStore (persist → AsyncStorage)
  user, accessToken, refreshToken, loading, isHydrated
  actions: login, logout, refreshTokenAction

expenseStore (no persist — in-memory only)
  expenses[], summary, pagination, loading, error
  actions: fetchExpenses, fetchNextPage, addExpense
```

Settlement data (preview + records) is local state inside each screen — it is not shared and changes frequently, so a global store would add complexity without benefit.

---

## Components and Interfaces

### AppHeader

**File:** `src/components/AppHeader.tsx`

```
Props:
  title: string

Reads from authStore:
  user (for initials derivation)
  logout (called on avatar press)

Layout:
  SafeAreaView edges={['top']}            ← top inset only
    View (row, bg-white, px-4, py-3, border-b border-border)
      Text  ← title, text-textPrimary, text-xl font-bold
      TouchableOpacity → calls logout()
        View (rounded-full, bg-primary, w-10 h-10, items-center justify-center)
          Text ← initials, text-white, font-bold
```

**Initials computation (pure function — exported for testing):**

```typescript
export function getInitials(name: string | undefined | null): string {
  if (!name || name.trim() === '') return '?';
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
```

---

### expenseStore

**File:** `src/store/expenseStore.ts`

```typescript
interface ExpenseState {
  expenses: Expense[];
  summary: ExpenseSummary | null;
  pagination: ExpenseListResponse['pagination'] | null;
  loading: boolean;
  error: string | null;

  fetchExpenses: (params?: GetExpensesParams) => Promise<void>;
  fetchNextPage: () => Promise<void>;
  addExpense: (expense: Expense) => void;
}
```

No `persist` middleware — data is always fetched fresh.

`fetchExpenses` resets `expenses` to the returned `items`, updates `summary` and `pagination`.

`fetchNextPage` is a no-op when `pagination.hasMore === false` or when `loading === true`. It appends `items` to the existing array and updates `pagination`.

`addExpense` uses an immutable prepend:
```typescript
addExpense: (expense) => set((s) => ({
  expenses: [expense, ...s.expenses],
  summary: s.summary
    ? { ...s.summary, grandTotal: s.summary.grandTotal + expense.amount }
    : s.summary,
})),
```

---

### OverviewScreen

**File:** `src/screens/dashboard/OverviewScreen.tsx`

Three-state pattern:
1. `loading && !summary` → full-screen `ActivityIndicator`
2. `error` → `ErrorState` component (message + retry button)
3. Data present → `ScrollView` with KPI cards + chart

**KPI layout (all inside ScrollView):**
- `KpiCard` — grand total (formatted currency)
- `KpiCard` — per-person share (grandTotal / userTotals.length)
- `KpiCard` per entry in `userTotals` (name + amount)
- `BarChart` from `react-native-chart-kit`

**Currency formatter (pure function — exported for testing):**
```typescript
export function formatCurrency(amount: number): string {
  return `₹ ${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
```

**BarChart data shape:**
```typescript
{
  labels: userTotals.map((u) => u.name.split(' ')[0]),   // first name only
  datasets: [{ data: userTotals.map((u) => u.totalAmount) }],
}
```

---

### PurchasesScreen

**File:** `src/screens/dashboard/PurchasesScreen.tsx`

**FlatList configuration:**
- `keyExtractor`: `expense._id`
- `onEndReached`: calls `fetchNextPage` when `pagination.hasMore` is `true`
- `onEndReachedThreshold`: `0.3`
- `ListFooterComponent`: spinner when `loading && expenses.length > 0`
- `ListEmptyComponent`: empty-state view when `!loading && expenses.length === 0`

**ExpenseRow** (inline or sub-component):
- Left column: title (bold), date (secondary), payer name (secondary small)
- Right column: amount (primary color, bold)
- `onPress` → opens `ExpenseDetailSheet` with the selected expense

**FAB:**
```
View (absolute bottom-6 right-6, z-10)
  TouchableOpacity (rounded-full bg-primary w-14 h-14 items-center justify-center shadow-lg)
    <Ionicons name="add" size={28} color="white" />
```

---

### AddExpenseModal

**File:** `src/components/AddExpenseModal.tsx`

Rendered inside `PurchasesScreen` as a `Modal` (RN core) with `presentationStyle="pageSheet"` (iOS) or `animationType="slide"`.

**Form schema (zod):**
```typescript
const schema = z.object({
  title:  z.string().min(1, 'Title is required').refine(
            (v) => v.trim().length > 0, 'Title cannot be blank'),
  amount: z.number({ invalid_type_error: 'Enter a valid amount' })
            .positive('Amount must be greater than 0'),
  date:   z.string().min(1, 'Date is required'),
  note:   z.string().optional(),
  image:  z.string().optional(),   // local URI after picker
});
```

**Image picker flow (Expo v57):**
```typescript
const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [4, 3],
  quality: 0.8,
});
if (!result.canceled) setValue('image', result.assets[0].uri);
```

Permissions are requested via `ImagePicker.requestMediaLibraryPermissionsAsync()` before launching.

**FormData construction for upload:**
```typescript
formData.append('image', {
  uri:  imageUri,
  name: 'photo.jpg',
  type: 'image/jpeg',
} as any);
```

**Props:**
```typescript
type AddExpenseModalProps = {
  visible: boolean;
  onClose: () => void;
  onSuccess: (expense: Expense) => void;
};
```

---

### ExpenseDetailSheet

**File:** `src/components/ExpenseDetailSheet.tsx`

RN core `Modal` with `animationType="slide"` and a semi-transparent backdrop.

**Props:**
```typescript
type ExpenseDetailSheetProps = {
  expense: Expense | null;
  onClose: () => void;
};
```

Renders only when `expense !== null`. Conditionally shows note section and image section.

---

### SettlementScreen

**File:** `src/screens/dashboard/SettlementScreen.tsx`

Local state only — no store involvement:
```typescript
const [preview, setPreview] = useState<SettlementPreview | null>(null);
const [loading, setLoading] = useState(true);
const [settling, setSettling] = useState(false);
const [error, setError] = useState<string | null>(null);
```

**Settlement flow:**
1. `useEffect` → `getPreview()` → set preview or error
2. "Settle Now" button → `Alert.alert` confirmation dialog
3. On confirm → `createSettlement({ periodFrom, periodTo })` → success toast, clear preview
4. On error → display error message inline

**Empty state condition:** `preview === null` after successful load (API returns `data: null`).

---

### SettlementLogsScreen

**File:** `src/screens/dashboard/SettlementLogsScreen.tsx`

Local state:
```typescript
const [records, setRecords] = useState<SettlementRecord[]>([]);
const [expandedId, setExpandedId] = useState<string | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

**Accordion logic:**
```typescript
const toggle = (id: string) =>
  setExpandedId((prev) => (prev === id ? null : id));
```

Only one row expanded at a time — enforced by a single `expandedId` string (not an array).

**SettlementLogRow** (sub-component or inline):
- Collapsed: date, total, period range
- Expanded (below the collapsed row, revealed with `Animated.View` height animation): per-person share, transactions list, user balance snapshot

---

### Shared sub-components

**`KpiCard`** (`src/components/KpiCard.tsx`)
```typescript
type KpiCardProps = {
  label: string;
  value: string;
  accent?: boolean;   // uses Colors.primary for value text when true
};
```

**`ErrorState`** (`src/components/ErrorState.tsx`)
```typescript
type ErrorStateProps = {
  message: string;
  onRetry: () => void;
};
```

**`EmptyState`** (`src/components/EmptyState.tsx`)
```typescript
type EmptyStateProps = {
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
};
```

---

## Data Models

All types are already defined in the codebase. The table below maps model ↔ screen:

| Type | Source file | Used by |
|------|-------------|---------|
| `Expense` | `src/types/expense.ts` | expenseStore, PurchasesScreen, AddExpenseModal, ExpenseDetailSheet |
| `ExpenseSummary` | `src/types/expense.ts` | expenseStore, OverviewScreen |
| `UserTotal` | `src/types/expense.ts` | OverviewScreen |
| `ExpenseListResponse` | `src/types/expense.ts` | expenseStore (pagination field) |
| `SettlementPreview` | `src/api/settlement.ts` | SettlementScreen |
| `SettlementRecord` | `src/api/settlement.ts` | SettlementLogsScreen |
| `SettlementTransaction` | `src/api/settlement.ts` | SettlementScreen, SettlementLogsScreen |
| `UserBalanceSnapshot` | `src/api/settlement.ts` | SettlementScreen, SettlementLogsScreen |
| `User` | `src/types/auth.ts` | AppHeader (via authStore) |

### expenseStore state shape

```typescript
{
  expenses:   Expense[];                                // default: []
  summary:    ExpenseSummary | null;                    // default: null
  pagination: ExpenseListResponse['pagination'] | null; // default: null
  loading:    boolean;                                  // default: false
  error:      string | null;                            // default: null
}
```

### Add Expense form data shape

```typescript
{
  title:  string;        // required, non-empty after trim
  amount: number;        // required, > 0
  date:   string;        // ISO date string, defaults to today
  note?:  string;        // optional
  image?: string;        // local file URI from image picker
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Initials derivation

*For any* non-null, non-empty user name string, `getInitials(name)` shall return a string of length 1 or 2 composed of uppercase characters that are the first letters of the name's whitespace-separated words.

**Validates: Requirements 1.2, 1.7**

---

### Property 2: Currency formatting

*For any* non-negative number `amount`, `formatCurrency(amount)` shall return a string that starts with `"₹ "`, contains the amount rounded to exactly two decimal places, and uses comma grouping consistent with the `en-IN` locale.

**Validates: Requirements 3.2**

---

### Property 3: Per-person share calculation

*For any* `grandTotal` ≥ 0 and `userTotals` array of length N ≥ 1, the per-person share displayed on the Overview screen shall equal `grandTotal / N`.

**Validates: Requirements 3.3**

---

### Property 4: fetchExpenses replaces store state

*For any* valid API response containing an `items` array of `Expense` objects and accompanying `summary` and `pagination`, calling `fetchExpenses()` shall replace the store's `expenses` array with exactly those items, update `summary` and `pagination` to match the response, and leave `error` as `null`.

**Validates: Requirements 2.2**

---

### Property 5: Loading flag lifecycle

*For any* call to `fetchExpenses` or `fetchNextPage`, the store's `loading` flag shall be `true` from the moment the call is initiated until it either resolves or rejects, and shall be `false` immediately afterwards.

**Validates: Requirements 2.3**

---

### Property 6: fetchNextPage appends without duplication

*For any* existing `expenses` array of length M and a next-page API response containing N new items, calling `fetchNextPage` when `pagination.hasMore === true` shall result in an `expenses` array of length M + N where the first M items are unchanged and the last N items are the new items.

**Validates: Requirements 2.4**

---

### Property 7: API error propagation

*For any* error thrown by `expenseApi.getExpenses` or `expenseApi.getExpenses` (next page), the store's `error` field shall be set to a non-empty string derived from the error, and `loading` shall be `false`.

**Validates: Requirements 2.5, 10.2**

---

### Property 8: addExpense prepends and updates grand total

*For any* expense object `e` added via `addExpense`, the resulting `expenses[0]` shall equal `e`, the list length shall increase by exactly 1, and `summary.grandTotal` shall equal the previous grand total plus `e.amount`.

**Validates: Requirements 2.6**

---

### Property 9: List renders exactly N rows for N expenses

*For any* `expenses` array of length N ≥ 0 loaded into the store, the PurchasesScreen `FlatList` shall render exactly N expense row items (excluding header, footer, and empty-state components).

**Validates: Requirements 4.2**

---

### Property 10: userTotals length drives KPI card and bar chart counts

*For any* `summary.userTotals` array of length N ≥ 1, the OverviewScreen shall render exactly N per-user `KpiCard` components and the `BarChart` shall be given a `datasets[0].data` array of exactly length N.

**Validates: Requirements 3.4, 3.5**

---

### Property 11: Accordion single-expand invariant

*For any* sequence of row-tap interactions on the SettlementLogsScreen, at most one row shall be in the expanded state at any point in time.

**Validates: Requirements 8.5**

---

### Property 12: Form validation rejects invalid inputs

*For any* form submission where `title` is empty or composed entirely of whitespace, or `amount` is zero or negative, the zod schema validation shall fail, the API shall NOT be called, and the error message shall be displayed to the user.

**Validates: Requirements 5.3**

---

## Error Handling

### Loading states

Every data-fetching screen follows the same three-state pattern:

```
loading=true, data empty  →  full-screen ActivityIndicator
loading=false, data present → render data
loading=false, error non-null → ErrorState (message + retry button)
loading=false, data empty → EmptyState
```

During paginated loads (subsequent pages), a footer spinner is shown while the main list stays visible.

### Toast notifications

`react-native-toast-message` is used for transient feedback:
- **Success:** green toast after successful `createExpense` or `createSettlement`
- **Error:** not used for error states — inline error components are preferred for recoverable errors

`Toast` must be mounted at the root of the app in `App.tsx` so it renders above the navigation stack.

### Confirmation dialogs

`Alert.alert` is used before `createSettlement` to ensure the user confirms an irreversible action. The dialog has two buttons: "Cancel" (no-op) and "Settle" (proceeds with the API call).

### Network error messages

Errors from axios are caught and the human-readable message is extracted:
```typescript
const msg = error?.response?.data?.message
  ?? error?.message
  ?? 'Something went wrong. Please try again.';
```

This string is stored in local `error` state or the store's `error` field, and rendered inside `ErrorState`.

---

## Testing Strategy

### Applicable PBT libraries

**jest** (already available in Expo projects) + **fast-check** for property-based testing.

Install: `yarn add -D fast-check @testing-library/react-native`

### Unit tests (example-based)

Cover specific behaviors, integration points, and edge cases:

- `AppHeader`: renders title; shows `?` for null user; calls `logout` on avatar press
- `OverviewScreen`: calls `fetchExpenses` on mount; shows spinner when loading; shows error + retry button on error
- `PurchasesScreen`: calls `fetchExpenses(page:1)` on mount; shows empty state; calls `fetchNextPage` on scroll end
- `AddExpenseModal`: submits correctly; shows inline error on API failure; disables button while submitting
- `ExpenseDetailSheet`: shows "No note added" placeholder; hides image section when absent
- `SettlementScreen`: shows confirmation dialog before settling; shows empty state when preview is null
- `SettlementLogsScreen`: shows full-screen spinner while loading; shows empty state for empty array

### Property-based tests (fast-check, min 100 iterations each)

Each property test references the corresponding design property.

**Feature: hisabkitab-app-build, Property 1: Initials derivation**
```
fc.property(fc.string(), (name) => {
  const result = getInitials(name);
  expect(result.length).toBeGreaterThanOrEqual(1);
  expect(result.length).toBeLessThanOrEqual(2);
  expect(result).toBe(result.toUpperCase());
})
```

**Feature: hisabkitab-app-build, Property 2: Currency formatting**
```
fc.property(fc.float({ min: 0, max: 1_000_000, noNaN: true }), (n) => {
  const result = formatCurrency(n);
  expect(result).toMatch(/^₹\s[\d,]+\.\d{2}$/);
})
```

**Feature: hisabkitab-app-build, Property 3: Per-person share**
```
fc.property(fc.float({ min: 0 }), fc.array(fc.record({...}), { minLength: 1 }), (total, users) => {
  const share = total / users.length;
  // assert displayed share equals share
})
```

**Feature: hisabkitab-app-build, Property 4: fetchExpenses replaces state**
```
fc.asyncProperty(fc.array(arbitraryExpense()), async (items) => {
  mockApi.mockResolvedValue({ data: { items, summary, pagination } });
  await store.fetchExpenses();
  expect(store.getState().expenses).toEqual(items);
})
```

**Feature: hisabkitab-app-build, Property 5: Loading flag lifecycle**  
Verify loading=true during pending, loading=false after resolve and after reject.

**Feature: hisabkitab-app-build, Property 6: fetchNextPage appends**
```
fc.asyncProperty(fc.array(arbitraryExpense()), fc.array(arbitraryExpense()), async (existing, next) => {
  // seed store with existing, mock next page
  await store.fetchNextPage();
  expect(store.getState().expenses).toEqual([...existing, ...next]);
})
```

**Feature: hisabkitab-app-build, Property 7: Error propagation**
```
fc.asyncProperty(fc.string({ minLength: 1 }), async (msg) => {
  mockApi.mockRejectedValue(new Error(msg));
  await store.fetchExpenses();
  expect(store.getState().error).toBeTruthy();
  expect(store.getState().loading).toBe(false);
})
```

**Feature: hisabkitab-app-build, Property 8: addExpense prepends**
```
fc.property(fc.array(arbitraryExpense()), arbitraryExpense(), (existing, newExp) => {
  // seed store; call addExpense
  expect(store.getState().expenses[0]).toEqual(newExp);
  expect(store.getState().expenses.length).toBe(existing.length + 1);
})
```

**Feature: hisabkitab-app-build, Property 9: List renders N rows**
```
fc.property(fc.array(arbitraryExpense()), async (expenses) => {
  // render PurchasesScreen with mocked store
  const rows = await screen.findAllByTestId('expense-row');
  expect(rows.length).toBe(expenses.length);
})
```

**Feature: hisabkitab-app-build, Property 10: userTotals drives KPI + chart**
```
fc.property(fc.array(arbitraryUserTotal(), { minLength: 1 }), (totals) => {
  // render OverviewScreen with mocked store
  const cards = screen.getAllByTestId('user-kpi-card');
  expect(cards.length).toBe(totals.length);
  // also assert BarChart data length
})
```

**Feature: hisabkitab-app-build, Property 11: Accordion single-expand**
```
fc.property(fc.array(arbitrarySettlementRecord(), { minLength: 2 }), fc.array(fc.nat(), { minLength: 1 }), (records, tapIndices) => {
  // render SettlementLogsScreen, simulate taps
  const expanded = screen.queryAllByTestId('expanded-row');
  expect(expanded.length).toBeLessThanOrEqual(1);
})
```

**Feature: hisabkitab-app-build, Property 12: Form validation rejects invalid inputs**
```
fc.property(
  fc.oneof(fc.constant(''), fc.string().filter(s => s.trim() === '')),
  fc.oneof(fc.constant(0), fc.float({ max: 0 })),
  (title, amount) => {
    const result = schema.safeParse({ title, amount, date: '2024-01-01' });
    expect(result.success).toBe(false);
  }
)
```

### Integration tests

- End-to-end: launch app, log in, verify all four tabs load without errors (manual / Detox)
- API shape validation: verify `expenseApi.getExpenses` and `settlementApi.getPreview` responses conform to TypeScript types at runtime
