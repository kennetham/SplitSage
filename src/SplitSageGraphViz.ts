import * as fs from 'fs';
import * as path from 'path';
import { Digraph, toDot } from 'ts-graphviz';

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

    toGraphviz(): Digraph {
        const g = new Digraph();

        // Add all vertices as nodes
        for (const vertex of this.adjacencyList.keys()) {
            g.createNode(vertex);
        }

        // Create edges
        for (const [from, edges] of this.adjacencyList) {
            for (const [to, weight] of edges) {
                g.createEdge([from, to], { label: weight.toFixed(2) });
            }
        }

        return g;
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

    generateGraphImage(outputPath: string): void {
        const g = this.graph.toGraphviz();
        const dot = toDot(g);
        fs.writeFileSync(outputPath, dot);
        console.log(`Graph DOT file saved to ${outputPath}`);
        console.log('To generate an image, use a tool like Graphviz. For example:');
        console.log(`dot -Tsvg ${outputPath} -o ${outputPath.replace('.dot', '.svg')}`);
    }
}

// Execute the code
function main() {
    const executor = new SplitSageGraph();

    // Assuming the tsv file is in the same directory as the script
    const filePath = path.join(__dirname, 'expenses.tsv');
    executor.readExpensesFromTSV(filePath);

    console.log('Settlements:');
    executor.getSettlements().forEach(settlement => console.log(settlement));

    // Generate and save the graph DOT file
    executor.generateGraphImage('SplitSageGraph.dot');
}

main();