# Tasks — HisabKitab App Build

## Phase 1 — Foundation

- [ ] 1.1 Mount `Toast` component in `App.tsx`
  - [ ] 1.1.1 Import `Toast` from `react-native-toast-message` in `App.tsx`
  - [ ] 1.1.2 Render `<Toast />` as the last child of the root fragment, above `AppNavigator` in z-order
  - [ ] 1.1.3 Verify the toast appears correctly on a test call (manual smoke test)

- [ ] 1.2 Implement `AppHeader` component
  - [ ] 1.2.1 Export a pure `getInitials(name: string | null | undefined): string` function from `src/components/AppHeader.tsx`
    - Returns up to 2 uppercase characters from the first letters of whitespace-separated words
    - Returns `'?'` when `name` is null, undefined, or empty/whitespace
  - [ ] 1.2.2 Apply `useSafeAreaInsets` (from `react-native-safe-area-context`) to add `paddingTop: insets.top` to the header container
  - [ ] 1.2.3 Style the header row: white background, horizontal padding `px-4`, vertical padding `py-3`, bottom border using `Colors.border`
  - [ ] 1.2.4 Style the title `Text`: `Colors.textPrimary`, `text-xl`, `font-bold`, left-aligned
  - [ ] 1.2.5 Style the avatar `TouchableOpacity → View`: circular (`rounded-full`), `w-10 h-10`, background `Colors.primary`, centered initials text in `Colors.white`, `font-bold`
  - [ ] 1.2.6 Wire `onPress` on the avatar `TouchableOpacity` to call `logout()` from `useAuthStore`
  - [ ] 1.2.7 Confirm all four dashboard screens already render `<AppHeader />` (they do — stubs exist)

- [ ] 1.3 Create global `expenseStore`
  - [ ] 1.3.1 Create `src/store/expenseStore.ts` with state fields: `expenses: Expense[]`, `summary: ExpenseSummary | null`, `pagination: ExpenseListResponse['pagination'] | null`, `loading: boolean`, `error: string | null`
  - [ ] 1.3.2 Implement `fetchExpenses(params?)` action:
    - Set `loading: true`, `error: null` before call
    - Call `expenseApi.getExpenses(params)`
    - On success: replace `expenses` with `data.items`, update `summary` and `pagination`, set `loading: false`
    - On error: extract human-readable message, set `error`, set `loading: false`
  - [ ] 1.3.3 Implement `fetchNextPage()` action:
    - No-op if `pagination?.hasMore !== true` or `loading === true`
    - Call `expenseApi.getExpenses({ page: pagination.page + 1 })`
    - On success: append new `items` to existing `expenses`, update `pagination`
    - On error: set `error`
    - Set `loading` appropriately before and after
  - [ ] 1.3.4 Implement `addExpense(expense: Expense)` action:
    - Prepend `expense` to `expenses` array
    - If `summary` is non-null, update `summary.grandTotal += expense.amount`
  - [ ] 1.3.5 Do NOT add `persist` middleware — store is in-memory only

---

## Phase 2 — Overview Screen

- [ ] 2.1 Create shared `KpiCard` component
  - [ ] 2.1.1 Create `src/components/KpiCard.tsx` accepting `label: string`, `value: string`, and optional `accent?: boolean`
  - [ ] 2.1.2 Style: white card, rounded corners, shadow, padding; value text uses `Colors.primary` when `accent=true` else `Colors.textPrimary`

- [ ] 2.2 Create shared `ErrorState` component
  - [ ] 2.2.1 Create `src/components/ErrorState.tsx` accepting `message: string` and `onRetry: () => void`
  - [ ] 2.2.2 Render error message text and a styled "Retry" `TouchableOpacity`

- [ ] 2.3 Create shared `EmptyState` component
  - [ ] 2.3.1 Create `src/components/EmptyState.tsx` accepting `message: string` and optional `icon`
  - [ ] 2.3.2 Render icon (if provided) and message text centered on screen

- [ ] 2.4 Export `formatCurrency` helper
  - [ ] 2.4.1 Create `src/utils/formatCurrency.ts` exporting `formatCurrency(amount: number): string`
  - [ ] 2.4.2 Implementation: `₹ ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

- [ ] 2.5 Implement `OverviewScreen`
  - [ ] 2.5.1 Connect to `expenseStore`: read `expenses`, `summary`, `loading`, `error`; call `fetchExpenses()` in `useEffect` on mount
  - [ ] 2.5.2 Render full-screen `ActivityIndicator` while `loading && !summary`
  - [ ] 2.5.3 Render `ErrorState` with retry when `error` is non-null
  - [ ] 2.5.4 Wrap content in a `ScrollView` for small screens
  - [ ] 2.5.5 Render grand total `KpiCard` using `formatCurrency(summary.grandTotal)` with `accent={true}`
  - [ ] 2.5.6 Render per-person share `KpiCard`: value = `formatCurrency(summary.grandTotal / summary.userTotals.length)` — guard against division by zero (show `₹ 0.00` when `userTotals.length === 0`)
  - [ ] 2.5.7 Render one `KpiCard` per `userTotal` entry showing user name and `formatCurrency(userTotal.totalAmount)` — add `testID="user-kpi-card"` for property test
  - [ ] 2.5.8 Render `BarChart` from `react-native-chart-kit`:
    - `labels`: first word of each user name
    - `datasets[0].data`: `userTotals.map(u => u.totalAmount)`
    - `width`: `Dimensions.get('window').width - 32`
    - `chartConfig` using `Colors.primary` for bars
  - [ ] 2.5.9 Render `<AppHeader title="Overview" />` at the top

---

## Phase 3 — Purchases Screen

- [ ] 3.1 Implement `ExpenseRow` sub-component (inline or separate file)
  - [ ] 3.1.1 Accept `expense: Expense` and `onPress: () => void`
  - [ ] 3.1.2 Display title (bold), formatted date (via `dayjs`), payer name (`expense.userId.name`), and formatted amount (`Colors.primary`)
  - [ ] 3.1.3 Add `testID="expense-row"` for property test

- [ ] 3.2 Implement `PurchasesScreen` list
  - [ ] 3.2.1 Connect to `expenseStore`; call `fetchExpenses({ page: 1 })` in `useEffect` on mount
  - [ ] 3.2.2 Render full-screen `ActivityIndicator` when `loading && expenses.length === 0`
  - [ ] 3.2.3 Render `FlatList` with `keyExtractor={item => item._id}`, `onEndReachedThreshold={0.3}`, `onEndReached` calling `fetchNextPage` when `pagination?.hasMore === true`
  - [ ] 3.2.4 Add `ListFooterComponent`: bottom spinner when `loading && expenses.length > 0`
  - [ ] 3.2.5 Add `ListEmptyComponent`: `EmptyState` with message "No expenses yet" when `!loading`
  - [ ] 3.2.6 Render `<AppHeader title="Purchases" />` at the top

- [ ] 3.3 Implement `AddExpenseModal`
  - [ ] 3.3.1 Create `src/components/AddExpenseModal.tsx` accepting `visible`, `onClose`, `onSuccess` props
  - [ ] 3.3.2 Set up `react-hook-form` with `zodResolver` using the schema defined in the design
  - [ ] 3.3.3 Implement title field: `TextInput` with validation error display
  - [ ] 3.3.4 Implement amount field: numeric `TextInput`, parse to number, validate > 0
  - [ ] 3.3.5 Implement date field: display formatted date string, open `DateTimePicker` from `@react-native-community/datetimepicker` on press; store as ISO date string
  - [ ] 3.3.6 Implement note field: optional multiline `TextInput`
  - [ ] 3.3.7 Implement image picker:
    - Call `ImagePicker.requestMediaLibraryPermissionsAsync()` first
    - Call `ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4,3], quality: 0.8 })`
    - On success (`!result.canceled`): store `result.assets[0].uri` in form state and show thumbnail `Image`
  - [ ] 3.3.8 Implement form submission:
    - Build `CreateExpenseDto` (construct image as `{ uri, name, type }` object for FormData)
    - Call `expenseApi.createExpense(dto)`
    - On success: call `onSuccess(expense)`, close modal, show success toast via `Toast.show`
    - On error: display error message below submit button, keep modal open
  - [ ] 3.3.9 Disable submit button and show `ActivityIndicator` inside it while submitting
  - [ ] 3.3.10 Add close button and `onRequestClose` / backdrop press to dismiss without saving

- [ ] 3.4 Wire FAB and modals in `PurchasesScreen`
  - [ ] 3.4.1 Add FAB (`TouchableOpacity`, absolute positioned, `bottom-6 right-6`) with `Ionicons add` icon, `bg-primary`, `rounded-full`
  - [ ] 3.4.2 Toggle `addModalVisible` state on FAB press
  - [ ] 3.4.3 Pass `onSuccess` to `AddExpenseModal` — call `expenseStore.addExpense(expense)` and show toast
  - [ ] 3.4.4 Track `selectedExpense: Expense | null` state for detail sheet

- [ ] 3.5 Implement `ExpenseDetailSheet`
  - [ ] 3.5.1 Create `src/components/ExpenseDetailSheet.tsx` accepting `expense: Expense | null` and `onClose`
  - [ ] 3.5.2 Use RN core `Modal` with `animationType="slide"` and semi-transparent backdrop
  - [ ] 3.5.3 Display: title, `formatCurrency(amount)`, `dayjs(date).format('DD MMM YYYY')`, payer name
  - [ ] 3.5.4 Conditionally show note section — if `expense.note` is absent/empty show "No note added" in `Colors.textSecondary`
  - [ ] 3.5.5 Conditionally show image — if `expense.image` is present, render full-width `Image` with aspect ratio; if absent, render nothing
  - [ ] 3.5.6 Add close button to dismiss the sheet

---

## Phase 4 — Settlement Screen

- [ ] 4.1 Implement `SettlementScreen`
  - [ ] 4.1.1 Declare local state: `preview`, `loading`, `settling`, `error` (as described in design)
  - [ ] 4.1.2 Fetch preview in `useEffect` on mount: call `settlementApi.getPreview()`, handle null data (no unsettled expenses) vs non-null (preview to show)
  - [ ] 4.1.3 Render full-screen `ActivityIndicator` while `loading`
  - [ ] 4.1.4 Render `ErrorState` with retry when `error` is non-null
  - [ ] 4.1.5 Render empty state ("All settled up! 🎉") when `preview === null` after successful load; disable "Settle Now" button in this state
  - [ ] 4.1.6 Render preview data when present:
    - Total unsettled amount (`formatCurrency(preview.totalAmount)`) and per-person share
    - One row per `preview.transactions`: payer name → payee name → amount
    - Per-user balance section from `preview.userSnapshot` — positive balance shown in `Colors.success`, negative in `Colors.danger`
  - [ ] 4.1.7 Render prominent "Settle Now" `TouchableOpacity` (`bg-primary`); disable and show spinner while `settling`
  - [ ] 4.1.8 On press: show `Alert.alert` confirmation with "Cancel" and "Settle" buttons
  - [ ] 4.1.9 On confirmation: call `settlementApi.createSettlement({ periodFrom: preview.periodFrom, periodTo: preview.periodTo })`
    - On success: show success toast, set `preview` to `null` (empty state)
    - On error: set `error` state with extracted message
  - [ ] 4.1.10 Render `<AppHeader title="Settlement" />` at the top

---

## Phase 5 — Settlement Logs Screen

- [ ] 5.1 Implement `SettlementLogsScreen`
  - [ ] 5.1.1 Declare local state: `records: SettlementRecord[]`, `expandedId: string | null`, `loading: boolean`, `error: string | null`
  - [ ] 5.1.2 Fetch records in `useEffect` on mount: call `settlementApi.getSettlements()`, populate `records`
  - [ ] 5.1.3 Render full-screen `ActivityIndicator` while `loading`
  - [ ] 5.1.4 Render `ErrorState` with retry when `error` is non-null
  - [ ] 5.1.5 Render `EmptyState` with message "No settlements yet" when `records.length === 0 && !loading`
  - [ ] 5.1.6 Implement `toggle(id: string)` function: sets `expandedId` to `id` if not currently expanded, or `null` if already expanded (accordion — one at a time)
  - [ ] 5.1.7 Render `FlatList` of `SettlementRecord` items with `keyExtractor={item => item._id}`
  - [ ] 5.1.8 Implement collapsed row: shows `dayjs(settledAt).format('DD MMM YYYY')`, `formatCurrency(totalAmount)`, period range (`dayjs(periodFrom).format('DD MMM')` – `dayjs(periodTo).format('DD MMM YYYY')`)
  - [ ] 5.1.9 Implement expanded row detail (shown below collapsed row when `expandedId === record._id`):
    - Per-person share
    - Transactions list (payer → payee, amount) — same layout as Settlement Screen
    - User balance snapshot at time of settlement
  - [ ] 5.1.10 Add `testID="expanded-row"` to expanded detail view for property test
  - [ ] 5.1.11 Render `<AppHeader title="Logs" />` at the top

---

## Cross-cutting / Cleanup

- [ ] 6.1 Verify `SafeAreaProvider` is present in the app root (check `AppNavigator.tsx` or `App.tsx`); add if missing
- [ ] 6.2 Confirm all four tab screens use `SafeAreaView` edges `['bottom']` for root view so content is not hidden by the tab bar or home indicator
- [ ] 6.3 Confirm `ProtectedTabs.tsx` already has `headerShown: false` (it does — verify no double header appears)
- [ ] 6.4 Write property-based tests for pure functions:
  - [ ] 6.4.1 `getInitials` — Property 1
  - [ ] 6.4.2 `formatCurrency` — Property 2
  - [ ] 6.4.3 Per-person share calculation — Property 3
- [ ] 6.5 Write store unit / property tests:
  - [ ] 6.5.1 `fetchExpenses` replaces state — Property 4
  - [ ] 6.5.2 Loading flag lifecycle — Property 5
  - [ ] 6.5.3 `fetchNextPage` appends — Property 6
  - [ ] 6.5.4 Error propagation — Property 7
  - [ ] 6.5.5 `addExpense` prepends and updates grandTotal — Property 8
- [ ] 6.6 Write screen / component property tests:
  - [ ] 6.6.1 List renders N rows for N expenses — Property 9
  - [ ] 6.6.2 userTotals drives KPI card + bar chart counts — Property 10
  - [ ] 6.6.3 Accordion single-expand invariant — Property 11
  - [ ] 6.6.4 Form validation rejects invalid inputs — Property 12
