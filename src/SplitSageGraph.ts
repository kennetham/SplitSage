import * as fs from 'fs';
import * as path from 'path';

interface Expense {
    name: string;
    amount: number;
    paidBy: string;
    participants: string[];
}

class Graph {
    private adjacencyList: Map<string, Map<string, number>>;

    constructor() {
        this.adjacencyList = new Map();
    }

    addVertex(vertex: string): void {
        if (!this.adjacencyList.has(vertex)) {
            this.adjacencyList.set(vertex, new Map());
        }
    }

    addEdge(from: string, to: string, weight: number): void {
        this.addVertex(from);
        this.addVertex(to);
        const fromEdges = this.adjacencyList.get(from)!;
        fromEdges.set(to, (fromEdges.get(to) || 0) + weight);
    }

    getVertices(): string[] {
        return Array.from(this.adjacencyList.keys());
    }

    getEdges(vertex: string): Map<string, number> {
        return this.adjacencyList.get(vertex) || new Map();
    }
}

class SplitSageGraph {
    private graph: Graph;

    constructor() {
        this.graph = new Graph();
    }

    readExpensesFromTSV(filePath: string): void {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const lines = fileContent.split('\n');

        // Skip the header line
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line) {
                const [name, amountStr, paidBy, participantsStr] = line.split('\t');
                const amount = parseFloat(amountStr);
                const participants = participantsStr.split(',');

                const expense: Expense = { name, amount, paidBy, participants };
                this.addExpense(expense);
            }
        }
    }

    private addExpense(expense: Expense): void {
        const share = expense.amount / expense.participants.length;
        expense.participants.forEach(participant => {
            if (participant !== expense.paidBy) {
                this.graph.addEdge(participant, expense.paidBy, share);
            }
        });
    }

    private simplifyGraph(): void {
        const vertices = this.graph.getVertices();
        for (const vertex of vertices) {
            const incomingEdges = new Map<string, number>();
            const outgoingEdges = this.graph.getEdges(vertex);

            for (const [other, weight] of outgoingEdges) {
                const reverseWeight = this.graph.getEdges(other).get(vertex) || 0;
                if (reverseWeight > 0) {
                    if (weight > reverseWeight) {
                        outgoingEdges.set(other, weight - reverseWeight);
                        this.graph.getEdges(other).delete(vertex);
                    } else if (weight < reverseWeight) {
                        outgoingEdges.delete(other);
                        this.graph.getEdges(other).set(vertex, reverseWeight - weight);
                    } else {
                        outgoingEdges.delete(other);
                        this.graph.getEdges(other).delete(vertex);
                    }
                }
            }
        }
    }

    getSettlements(): string[] {
        this.simplifyGraph();
        const settlements: string[] = [];
        const vertices = this.graph.getVertices();

        for (const from of vertices) {
            const edges = this.graph.getEdges(from);
            for (const [to, amount] of edges) {
                if (amount > 0.01) {
                    settlements.push(`${from} owes ${to} $${amount.toFixed(2)}`);
                }
            }
        }

        return settlements;
    }
}

// Execute the code
const executor = new SplitSageGraph();

// Assuming the tsv file is in the same directory as the script
const filePath = path.join(__dirname, 'expenses.tsv');
executor.readExpensesFromTSV(filePath);

console.log('Settlements:');
executor.getSettlements().forEach(settlement => console.log(settlement));