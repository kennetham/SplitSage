import * as fs from 'fs';
import * as path from 'path';

class Heap<T> {
  private heap: T[] = [];
  constructor(private compare: (a: T, b: T) => number) {}

  private parent(i: number): number { return Math.floor((i - 1) / 2); }
  private leftChild(i: number): number { return 2 * i + 1; }
  private rightChild(i: number): number { return 2 * i + 2; }

  private swap(i: number, j: number): void {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
  }

  private siftUp(i: number): void {
    while (i > 0 && this.compare(this.heap[this.parent(i)], this.heap[i]) > 0) {
      this.swap(i, this.parent(i));
      i = this.parent(i);
    }
  }

  private siftDown(i: number): void {
    let minIndex = i;
    const l = this.leftChild(i);
    if (l < this.heap.length && this.compare(this.heap[l], this.heap[minIndex]) < 0) {
      minIndex = l;
    }
    const r = this.rightChild(i);
    if (r < this.heap.length && this.compare(this.heap[r], this.heap[minIndex]) < 0) {
      minIndex = r;
    }
    if (i !== minIndex) {
      this.swap(i, minIndex);
      this.siftDown(minIndex);
    }
  }

  insert(item: T): void {
    this.heap.push(item);
    this.siftUp(this.heap.length - 1);
  }

  extract(): T | undefined {
    if (this.heap.length === 0) return undefined;
    const result = this.heap[0];
    this.heap[0] = this.heap[this.heap.length - 1];
    this.heap.pop();
    if (this.heap.length > 0) {
      this.siftDown(0);
    }
    return result;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }
}

interface Person {
  name: string;
  amount: number;
}

interface Settlement {
  from: string;
  to: string;
  amount: number;
}

interface Expense {
  name: string;
  amount: number;
  paidBy: string;
  participants: string[];
}

function readExpensesFromTSV(filePath: string): Expense[] {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const lines = fileContent.split('\n');
  
  // Skip the header line
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

function calculateBalances(expenses: Expense[]): Map<string, number> {
  const balances = new Map<string, number>();

  for (const expense of expenses) {
    const share = expense.amount / expense.participants.length;
    
    // Update payer's balance
    balances.set(expense.paidBy, (balances.get(expense.paidBy) || 0) + expense.amount);
    
    // Update participants' balances
    for (const participant of expense.participants) {
      balances.set(participant, (balances.get(participant) || 0) - share);
    }
  }

  return balances;
}

function minimizeCashFlow(balances: Map<string, number>): Settlement[] {
  // Create max heap for creditors and min heap for debtors
  const maxHeap = new Heap<Person>((a, b) => b.amount - a.amount);
  const minHeap = new Heap<Person>((a, b) => a.amount - b.amount);

  for (const [name, amount] of balances.entries()) {
    if (amount > 0) {
      maxHeap.insert({ name, amount });
    } else if (amount < 0) {
      minHeap.insert({ name, amount: -amount });
    }
  }

  const settlements: Settlement[] = [];

  while (!maxHeap.isEmpty() && !minHeap.isEmpty()) {
    const creditor = maxHeap.extract()!;
    const debtor = minHeap.extract()!;

    const amount = Math.min(creditor.amount, debtor.amount);
    settlements.push({
      from: debtor.name,
      to: creditor.name,
      amount: Number(amount.toFixed(2))
    });

    if (creditor.amount > debtor.amount) {
      maxHeap.insert({ name: creditor.name, amount: creditor.amount - debtor.amount });
    } else if (creditor.amount < debtor.amount) {
      minHeap.insert({ name: debtor.name, amount: debtor.amount - creditor.amount });
    }
  }

  return settlements;
}

// Execute the code
const filePath = path.join(__dirname, 'expenses.tsv');
const expenses = readExpensesFromTSV(filePath);
const balances = calculateBalances(expenses);
const optimizedSettlements = minimizeCashFlow(balances);

console.log("Expenses:");
expenses.forEach(e => console.log(`${e.name}: $${e.amount.toFixed(2)} paid by ${e.paidBy} for ${e.participants.join(', ')}`));

console.log("\nBalances:");
balances.forEach((amount, name) => console.log(`${name}: $${amount.toFixed(2)}`));

console.log("\nOptimized Settlements:");
optimizedSettlements.forEach(s => console.log(`${s.from} owes ${s.to}: $${s.amount.toFixed(2)}`));

// Calculate total debt transferred
const totalDebtTransferred = optimizedSettlements.reduce((sum, s) => sum + s.amount, 0);
console.log(`\nTotal debt transferred: $${totalDebtTransferred.toFixed(2)}`);

// Calculate total debt owed
const totalDebtOwed = Array.from(balances.values()).reduce((sum, balance) => sum + Math.max(0, -balance), 0);
console.log(`Total debt owed: $${totalDebtOwed.toFixed(2)}`);