# Requirements Document

## Introduction

HisabKitab is a shared expense tracker mobile app built with Expo (React Native). The app is already scaffolded with authentication, bottom tab navigation, and API layers. This spec covers building out all four placeholder screens — Overview, Purchases, Settlement, and Settlement Logs — along with a properly styled AppHeader and a global expense store. The goal is a complete, production-ready UI that connects to the existing backend API.

## Glossary

- **App**: The HisabKitab React Native (Expo) application
- **AppHeader**: The top navigation bar component rendered on every authenticated screen
- **Overview_Screen**: The first tab showing KPI cards and spending charts
- **Purchases_Screen**: The second tab showing the paginated expense list and add-expense flow
- **Settlement_Screen**: The third tab showing live balance preview and the settle-now action
- **Logs_Screen**: The fourth tab showing the history of completed settlements
- **Expense**: A single spending record with title, amount, date, optional note, and optional image
- **Expense_Store**: The Zustand global store managing expense list state, pagination, and loading flags
- **ExpenseListResponse**: The API response shape for `GET /expense` as defined in `src/types/expense.ts`
- **SettlementPreview**: The live, unsaved balance computation returned by `GET /settlement/preview`
- **SettlementRecord**: A saved settlement document returned by `GET /settlement`
- **FAB**: Floating Action Button — a circular button fixed to the bottom-right of a screen
- **Add_Expense_Modal**: The bottom sheet / modal form used to create a new expense
- **Expense_Detail_Sheet**: The bottom sheet / modal used to view a single expense's full details
- **Settlement_Detail_Sheet**: The expandable detail view for a single settlement log entry
- **KPI_Card**: A summary card displaying a single key metric (e.g., grand total, per-person share)
- **User**: An authenticated person as defined in `src/types/auth.ts`
- **UserTotal**: A per-user spending aggregate as defined in `src/types/expense.ts`
- **SettlementTransaction**: A single directional payment leg as defined in `src/api/settlement.ts`
- **Colors**: The design token object exported from `src/constants/colors.ts`
- **NativeWind**: The TailwindCSS-for-React-Native library used for styling in the project

---

## Requirements

---

### Requirement 1: AppHeader Component

**User Story:** As a logged-in user, I want a consistent header on every screen so that I always know which screen I am on and can log out easily.

#### Acceptance Criteria

1. THE App_Header SHALL display the screen title passed as a prop on the left side of the header.
2. THE App_Header SHALL display a circular avatar on the right side of the header containing the user's initials (up to two characters, uppercased), derived from `user.name` in the Auth_Store.
3. WHEN the user presses the avatar, THE App_Header SHALL call the `logout` action from the Auth_Store.
4. THE App_Header SHALL apply a safe-area top inset so content is not obscured by the device status bar.
5. THE App_Header SHALL use `Colors.primary` (`#ff6b35`) as the avatar background color and `Colors.white` for the initials text.
6. THE App_Header SHALL use `Colors.textPrimary` for the title text.
7. IF `user` is null in the Auth_Store, THEN THE App_Header SHALL display `?` as the avatar initials.
8. THE App_Header SHALL be rendered on all four dashboard tab screens by passing `headerShown: false` at the navigator level and rendering the component at the top of each screen.

---

### Requirement 2: Global Expense Store

**User Story:** As a developer, I want a centralised Zustand store for expenses so that all screens share the same data without redundant API calls.

#### Acceptance Criteria

1. THE Expense_Store SHALL expose the following state fields: `expenses` (array of `Expense`), `summary` (of type `ExpenseSummary | null`), `pagination` (of type `ExpenseListResponse['pagination'] | null`), `loading` (boolean), and `error` (string or null).
2. THE Expense_Store SHALL expose a `fetchExpenses` action that calls `expenseApi.getExpenses` with optional filter params and replaces the `expenses` array with the returned items.
3. WHEN `fetchExpenses` is called, THE Expense_Store SHALL set `loading` to `true` before the API call and `false` after it completes or fails.
4. THE Expense_Store SHALL expose a `fetchNextPage` action that appends the next page of results to the existing `expenses` array when `pagination.hasMore` is `true`.
5. IF `fetchExpenses` or `fetchNextPage` receives an error from the API, THEN THE Expense_Store SHALL store the error message in the `error` field.
6. THE Expense_Store SHALL expose an `addExpense` action that prepends a newly created `Expense` to the `expenses` array and updates `summary.grandTotal` accordingly.
7. THE Expense_Store SHALL NOT persist expense data to AsyncStorage (expenses are always fetched fresh from the server on mount).

---

### Requirement 3: Overview Screen

**User Story:** As a user, I want a dashboard overview so that I can immediately see total spending, per-person share, and a visual breakdown.

#### Acceptance Criteria

1. WHEN the Overview_Screen mounts, THE Overview_Screen SHALL call `fetchExpenses` from the Expense_Store to load the latest data.
2. THE Overview_Screen SHALL display a KPI_Card showing the grand total amount formatted as a currency string (e.g., `₹ 1,234.00`).
3. THE Overview_Screen SHALL display a KPI_Card showing the per-person share, calculated as `grandTotal / number of unique users in userTotals`.
4. THE Overview_Screen SHALL display one KPI_Card per entry in `summary.userTotals`, each showing that user's name and their total spending amount.
5. THE Overview_Screen SHALL display a bar chart using `react-native-chart-kit` where each bar represents one user's total spend from `summary.userTotals`.
6. WHILE `Expense_Store.loading` is `true`, THE Overview_Screen SHALL display a loading indicator in place of the chart and KPI cards.
7. IF `Expense_Store.error` is non-null, THEN THE Overview_Screen SHALL display the error message with a retry button that calls `fetchExpenses` again.
8. THE Overview_Screen SHALL render the AppHeader with the title `"Overview"`.
9. THE Overview_Screen SHALL be scrollable so that all KPI cards and the chart are accessible on small screens.

---

### Requirement 4: Purchases Screen — Expense List

**User Story:** As a user, I want to browse all expenses in a paginated list so that I can review past spending.

#### Acceptance Criteria

1. WHEN the Purchases_Screen mounts, THE Purchases_Screen SHALL call `fetchExpenses` from the Expense_Store with `page: 1` to load the first page.
2. THE Purchases_Screen SHALL render each expense from `Expense_Store.expenses` as a list row displaying: title, formatted amount, the name of the user who created it (`expense.userId.name`), and the formatted date.
3. WHEN the user scrolls to the end of the list and `pagination.hasMore` is `true`, THE Purchases_Screen SHALL call `fetchNextPage` to load the next page.
4. WHILE `Expense_Store.loading` is `true` and `expenses` is empty, THE Purchases_Screen SHALL display a full-screen loading indicator.
5. WHILE `Expense_Store.loading` is `true` and expenses exist (i.e., loading a subsequent page), THE Purchases_Screen SHALL display a spinner at the bottom of the list.
6. IF `Expense_Store.expenses` is empty after a successful fetch, THEN THE Purchases_Screen SHALL display an empty-state illustration and message.
7. THE Purchases_Screen SHALL render the AppHeader with the title `"Purchases"`.

---

### Requirement 5: Purchases Screen — Add Expense

**User Story:** As a user, I want to add a new expense via a modal form so that I can log a purchase quickly.

#### Acceptance Criteria

1. THE Purchases_Screen SHALL render a FAB fixed to the bottom-right of the screen using `Colors.primary` as the background.
2. WHEN the user presses the FAB, THE Purchases_Screen SHALL open the Add_Expense_Modal as a bottom sheet.
3. THE Add_Expense_Modal SHALL contain the following fields validated with `react-hook-form` and `zod`: `title` (required, non-empty string), `amount` (required, positive number), `date` (required, defaults to today, selected via `@react-native-community/datetimepicker`), `note` (optional string), and `image` (optional, selected via `expo-image-picker`).
4. WHEN the user submits a valid form, THE Add_Expense_Modal SHALL call `expenseApi.createExpense` with the form data as `FormData`.
5. WHEN `createExpense` succeeds, THE Add_Expense_Modal SHALL call `Expense_Store.addExpense` with the returned `Expense`, close the modal, and show a success toast via `react-native-toast-message`.
6. IF `createExpense` returns an error, THEN THE Add_Expense_Modal SHALL display the error message below the submit button and NOT close the modal.
7. WHILE the add-expense submission is in progress, THE Add_Expense_Modal SHALL disable the submit button and show a loading indicator inside it.
8. THE Add_Expense_Modal SHALL allow the user to pick an image from the device gallery using `expo-image-picker` and SHALL display a thumbnail preview of the selected image.
9. WHEN the user presses outside the modal or presses a close button, THE Add_Expense_Modal SHALL dismiss without saving.

---

### Requirement 6: Purchases Screen — Expense Detail

**User Story:** As a user, I want to tap an expense row to see its full details so that I can review the note and image.

#### Acceptance Criteria

1. WHEN the user taps an expense row in the Purchases_Screen list, THE Purchases_Screen SHALL open the Expense_Detail_Sheet.
2. THE Expense_Detail_Sheet SHALL display: title, amount (formatted), date (formatted), the name of the user who created it, the note (if present), and the image (if present, rendered as a full-width image).
3. WHEN no note is present, THE Expense_Detail_Sheet SHALL display a placeholder text `"No note added"`.
4. WHEN no image is present, THE Expense_Detail_Sheet SHALL NOT render the image section.
5. THE Expense_Detail_Sheet SHALL include a close button to dismiss it.

---

### Requirement 7: Settlement Screen

**User Story:** As a user, I want to see who owes whom before settling so that I can confirm the amounts are correct before triggering a settlement.

#### Acceptance Criteria

1. WHEN the Settlement_Screen mounts, THE Settlement_Screen SHALL call `settlementApi.getPreview` and display the returned `SettlementPreview`.
2. THE Settlement_Screen SHALL render the AppHeader with the title `"Settlement"`.
3. THE Settlement_Screen SHALL display the total unsettled amount and the per-person share from the preview.
4. THE Settlement_Screen SHALL render one row per entry in `SettlementPreview.transactions`, showing the payer name, payee name, and amount owed.
5. THE Settlement_Screen SHALL display a per-person balance section showing each user's net balance (positive = owed money, negative = owes money) from `SettlementPreview.userSnapshot`.
6. THE Settlement_Screen SHALL render a prominent `"Settle Now"` button.
7. WHEN the user presses `"Settle Now"`, THE Settlement_Screen SHALL show a confirmation dialog before proceeding.
8. WHEN the user confirms, THE Settlement_Screen SHALL call `settlementApi.createSettlement` with the `periodFrom` and `periodTo` from the current preview.
9. WHEN `createSettlement` succeeds, THE Settlement_Screen SHALL show a success toast, clear the preview, and display an empty-state indicating no unsettled expenses.
10. IF `getPreview` returns `null` data (no unsettled expenses exist), THEN THE Settlement_Screen SHALL display an empty-state message instead of the preview and SHALL disable the `"Settle Now"` button.
11. WHILE `createSettlement` is in progress, THE Settlement_Screen SHALL disable the `"Settle Now"` button and show a loading indicator.
12. IF `createSettlement` or `getPreview` returns an error, THEN THE Settlement_Screen SHALL display the error message and a retry button.

---

### Requirement 8: Settlement Logs Screen

**User Story:** As a user, I want to browse the history of past settlements so that I can audit what was settled and when.

#### Acceptance Criteria

1. WHEN the Logs_Screen mounts, THE Logs_Screen SHALL call `settlementApi.getSettlements` and display the returned array of `SettlementRecord` items.
2. THE Logs_Screen SHALL render the AppHeader with the title `"Logs"`.
3. THE Logs_Screen SHALL render each `SettlementRecord` as a collapsed summary row showing: settlement date (`settledAt` formatted), total amount, and the period covered (`periodFrom` – `periodTo`).
4. WHEN the user taps a summary row, THE Logs_Screen SHALL expand that row (or open a Settlement_Detail_Sheet) to show: per-person share, the full transactions list (payer → payee, amount), and the user balance snapshot at the time of settlement.
5. WHEN a row is expanded, THE Logs_Screen SHALL collapse any previously expanded row so that only one row is expanded at a time.
6. WHILE `getSettlements` is loading, THE Logs_Screen SHALL display a full-screen loading indicator.
7. IF `getSettlements` returns an empty array, THEN THE Logs_Screen SHALL display an empty-state message.
8. IF `getSettlements` returns an error, THEN THE Logs_Screen SHALL display the error message and a retry button.

---

### Requirement 9: Navigation and Screen Layout

**User Story:** As a user, I want all screens to be consistently laid out with a safe-area-aware header and scrollable body so that the app looks correct on all device sizes.

#### Acceptance Criteria

1. THE App SHALL render `AppHeader` at the top of every dashboard screen (Overview, Purchases, Settlement, Logs), with `headerShown: false` set on the tab navigator so no duplicate header appears.
2. THE App SHALL wrap each screen's root view with `SafeAreaView` (from `react-native-safe-area-context`) to respect device notches and home indicators.
3. THE App SHALL set the tab bar active tint to `Colors.primary` and inactive tint to `Colors.textSecondary` as already defined in `ProtectedTabs.tsx`.
4. THE App SHALL display toast notifications using `react-native-toast-message`, with the `Toast` component mounted at the root level in `App.tsx`.

---

### Requirement 10: Error Handling and Loading States

**User Story:** As a user, I want clear feedback when data is loading or when something goes wrong so that I am never left staring at a blank screen.

#### Acceptance Criteria

1. THE App SHALL display a loading spinner (using `ActivityIndicator`) whenever any screen is fetching data for the first time.
2. IF any API call fails with a network error, THEN THE App SHALL display a human-readable error message (not a raw error object) to the user.
3. THE App SHALL provide a visible retry mechanism on every error state screen so the user can re-trigger the failed request without navigating away.
4. WHEN a destructive or irreversible action is about to be taken (i.e., "Settle Now"), THE App SHALL require explicit user confirmation via an `Alert.alert` confirmation dialog before proceeding.
