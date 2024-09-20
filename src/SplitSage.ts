import * as fs from 'fs';
import * as path from 'path';

interface Expense {
    name: string;
    amount: number;
    paidBy: string;
    participants: string[];
}

function readExpensesFromTSV(filePath: string): Expense[] {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n');
    
    const expenses: Expense[] = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
            const [name, amountStr, paidBy, participantsStr] = line.split('\t');
            const amount = parseFloat(amountStr);
            const participants = participantsStr.split(',');
            
            expenses.push({ name, amount, paidBy, participants });
        }
    }
    return expenses;
}

function calculateNetBalances(expenses: Expense[]): Map<string, number> {
    const balances = new Map<string, number>();

    for (const expense of expenses) {
        const share = expense.amount / expense.participants.length;
        balances.set(expense.paidBy, (balances.get(expense.paidBy) || 0) + expense.amount);
        for (const participant of expense.participants) {
            balances.set(participant, (balances.get(participant) || 0) - share);
        }
    }

    return balances;
}

function roundToTwoDecimals(num: number): number {
    return Math.round(num * 100) / 100;
}

function optimizeSettlements(balances: Map<string, number>): { from: string; to: string; amount: number }[] {
    const debtors = Array.from(balances.entries())
        .filter(([, balance]) => balance < 0)
        .sort(([, a], [, b]) => a - b);
    const creditors = Array.from(balances.entries())
        .filter(([, balance]) => balance > 0)
        .sort(([, a], [, b]) => b - a);

    const settlements: { from: string; to: string; amount: number }[] = [];

    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
        const [debtor, debtAmount] = debtors[i];
        const [creditor, creditAmount] = creditors[j];

        const amount = Math.min(-debtAmount, creditAmount);
        settlements.push({
            from: debtor,
            to: creditor,
            amount: roundToTwoDecimals(amount)
        });

        debtors[i][1] += amount;
        creditors[j][1] -= amount;

        if (roundToTwoDecimals(debtors[i][1]) === 0) i++;
        if (roundToTwoDecimals(creditors[j][1]) === 0) j++;
    }

    return settlements;
}

// Main execution
const filePath = path.join(__dirname, 'expenses.tsv');
const expenses = readExpensesFromTSV(filePath);

console.log("Load TSV File:");
expenses.forEach(e => console.log(`${e.name}: $${e.amount.toFixed(2)} paid by ${e.paidBy} for ${e.participants.join(', ')}`));

const netBalances = calculateNetBalances(expenses);

console.log("\nNet Balances:");
for (const [person, balance] of netBalances.entries()) {
    console.log(`${person}: $${balance.toFixed(2)}`);
}

const optimizedSettlements = optimizeSettlements(netBalances);

console.log("\nOptimized Settlements:");
optimizedSettlements.forEach(s => console.log(`${s.from} owes ${s.to}: $${s.amount.toFixed(2)}`));

const totalDebtTransferred = optimizedSettlements.reduce((sum, s) => sum + s.amount, 0);
console.log(`\nTotal debts to be transferred: $${totalDebtTransferred.toFixed(2)}`);

// Verify that all balances sum to zero (within floating-point precision)
const sumOfBalances = Array.from(netBalances.values()).reduce((sum, balance) => sum + balance, 0);
console.log(`Sum of all balances: $${sumOfBalances.toFixed(2)}`);
console.log(`All accounts settled: ${Math.abs(sumOfBalances) < 0.01}`);