# SplitSage
An intelligent travel expense splitter among friends. I was inspired by SplitWise's Debt Simplification Algorithm and wrote a few using different algorithms out of curiousity.

## Problem Statement

You are developing an expense splitting application for a group of friends. The application needs to process a list of expenses and determine the optimal way for the group to settle their debts.

### Input Format

The input is a tab-separated values (TSV) file where each line represents an expense. The first line is a header, and subsequent lines have the following format:

```
ExpenseName    Amount    PaidBy    Participants
```

- `ExpenseName`: A string representing the name of the expense (1 ≤ length ≤ 100)
- `Amount`: A floating-point number representing the total amount of the expense (0 < Amount ≤ 10000)
- `PaidBy`: A single uppercase letter representing the person who paid for the expense
- `Participants`: A comma-separated list of uppercase letters representing the people who shared the expense

### Constraints

- 1 ≤ Number of expenses ≤ 1000
- 2 ≤ Number of participants ≤ 26 (represented by uppercase letters A-Z)
- All amounts are positive and have at most two decimal places
- Each expense has at least two participants
- The person who paid for an expense is always included in the participants

### Output Format

The program should output:

1. A list of individual debts showing how each expense contributes to the overall debt structure.
2. The initial balances for each participant.
3. A list of settlements that will bring all balances to zero.
4. Verification that all accounts are settled to zero after applying the settlements.

### Sample Input

```
ExpenseName    Amount    PaidBy    Participants
Dinner         100.00    A         A,B,C,D
Movie          50.00     B         A,B,C
Taxi           30.50     C         B,C,D
```

### Sample Output

```
Individual Debts:
B owes A $25.00 for Dinner
C owes A $25.00 for Dinner
D owes A $25.00 for Dinner
A owes B $16.67 for Movie
C owes B $16.67 for Movie
B owes C $10.00 for Taxi
D owes C $10.00 for Taxi

Initial Balances:
A: $33.33
B: $-18.33
C: $-1.67
D: $-13.33

Settlements:
B owes A $18.33
D owes A $13.33
C owes A $1.67

Verifying Settlements:
Final Balances after Settlements:
A: $0.00
B: $0.00
C: $0.00
D: $0.00

All accounts settled to zero: true
```

## Code Explanation

The `SplitSage` class implements the expense splitting algorithm. Here's an overview of the key components:

1. `readExpensesFromFile`: Reads the TSV file and processes each expense.
2. `addExpense`: Updates the balances for each participant involved in an expense.
3. `getIndividualDebts`: Generates a list of individual debts based on the expenses.
4. `getSettlements`: Calculates the optimal settlements to bring all balances to zero.
5. `verifySettlements`: Checks if the calculated settlements indeed bring all balances to zero.

### Time Complexity

- Reading expenses: O(n), where n is the number of expenses
- Calculating settlements: O(m log m), where m is the number of participants (due to sorting)
- Overall: O(n + m log m)

### Space Complexity

- O(n + m), where n is the number of expenses and m is the number of participants

The space is used to store the list of expenses and the balance for each participant.

## Setup and Execution

### Prerequisites

- Node.js (version 12 or higher)
- TypeScript

### Installation

1. Clone the repository or download the source code.
2. Navigate to the project directory.
3. Install the required dependencies:

```bash
npm init -y
yarn install typescript ts-node @types/node
```

### Executing the Code

1. Ensure your `expenses.tsv` file is in the same directory as the script.
2. Run the script using ts-node:

```bash
npx ts-node SplitSage.ts
npx ts-node SplitSageGraph.ts
npx ts-node SplitSageGraphViz.ts
npx ts-node SplitSageHeap.ts
```

### Running Tests

To thoroughly test the algorithm, you can create multiple TSV files with different expense scenarios. Run the script with each file to ensure it correctly handles various cases, including edge cases like:

- Expenses where all participants owe the payer
- Expenses where the payer is the only participant
- Large groups with many expenses
- Scenarios where some participants neither owe money nor are owed money

Modify the `filePath` in the script to point to different test files:

```typescript
const filePath = path.join(__dirname, 'TestExpenses1.tsv');
```