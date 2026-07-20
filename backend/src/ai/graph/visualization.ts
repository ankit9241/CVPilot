/**
 * Generate Mermaid diagram from LangGraph graph structure
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function generateMermaidDiagram(graph: any): string {
  // Extract nodes and edges from graph
  const nodes = graph.nodes || [];
  const edges = graph.edges || [];

  // Build Mermaid syntax
  let mermaid = 'graph TD\n';

  // Add nodes
  const nodeMap = new Map<string, string>();
  for (const node of nodes) {
    const nodeId = node.id === '__start__' ? 'START' : node.id === '__end__' ? 'END' : node.id;
    const label =
      node.id === '__start__'
        ? 'Start'
        : node.id === '__end__'
          ? 'End'
          : (node.id as string)
              .split('-')
              .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');

    nodeMap.set(node.id, nodeId);

    if (node.id === '__start__' || node.id === '__end__') {
      mermaid += `${nodeId}([${label}])\n`;
    } else {
      mermaid += `${nodeId}["${label}"]\n`;
    }
  }

  // Add edges
  for (const edge of edges) {
    const fromId = nodeMap.get(edge.source) || edge.source;
    const toId = nodeMap.get(edge.target) || edge.target;
    const label = edge.data ? ` |${edge.data}| ` : ' ';
    mermaid += `${fromId}${label}-->${toId}\n`;
  }

  return mermaid;
}

/**
 * Generate HTML visualization of the graph
 */
export function generateGraphHTML(mermaidDiagram: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <title>Resume Generation Graph</title>
  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    h1 {
      color: #333;
    }
    .mermaid {
      display: flex;
      justify-content: center;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Resume Generation Workflow Graph</h1>
    <p>Official LangGraph implementation with 9 sequential nodes and parallel selection support</p>

    <div class="mermaid">
${mermaidDiagram}
    </div>

    <h2>Workflow Details</h2>
    <ul>
      <li><strong>Total Nodes:</strong> 9</li>
      <li><strong>Sequential Nodes:</strong> validate-context, analyze-job, generate-summary, experience-bullets, project-bullets, generate-resume-json</li>
      <li><strong>Parallel Nodes:</strong> select-experiences, select-projects, select-skills (run concurrently after analyze-job)</li>
      <li><strong>Input:</strong> ResumeContext</li>
      <li><strong>Output:</strong> GeneratedResume</li>
      <li><strong>Support:</strong> Conditional edges for future ATS feedback loop</li>
    </ul>
  </div>

  <script>
    mermaid.initialize({ startOnLoad: true, theme: 'default' });
    mermaid.contentLoaded();
  </script>
</body>
</html>`;
}

/**
 * Generate ASCII diagram for terminal display
 */
export function generateASCIDiagram(): string {
  return `
Resume Generation Workflow (LangGraph)
=====================================

                     ┌─────────────────────┐
                     │ ResumeContext Input │
                     └──────────┬──────────┘
                                │
                                ▼
                         ┌──────────────┐
                         │   Validate   │
                         │   Context    │
                         └──────┬───────┘
                                │
                                ▼
                         ┌──────────────┐
                         │   Analyze    │
                         │      Job     │
                         └──────┬───────┘
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
         ┌──────────┐   ┌──────────┐   ┌─────────┐
         │ Select   │   │ Select   │   │ Select  │
         │   Exp   │   │Projects  │   │ Skills  │
         └────┬─────┘   └─────┬────┘   └────┬────┘
              └────────────────┼──────────────┘
                               ▼
                        ┌──────────────┐
                        │   Generate   │
                        │   Summary    │
                        └──────┬───────┘
                               │
                               ▼
                        ┌──────────────┐
                        │   Rewrite    │
                        │ Experiences  │
                        └──────┬───────┘
                               │
                               ▼
                        ┌──────────────┐
                        │   Rewrite    │
                        │   Projects   │
                        └──────┬───────┘
                               │
                               ▼
                        ┌──────────────┐
                        │  Generate    │
                        │  Resume JSON │
                        └──────┬───────┘
                               │
                               ▼
                     ┌──────────────────┐
                     │ GeneratedResume  │
                     │     Output       │
                     └──────────────────┘

Execution Model:
- Sequential: validate → analyze → summary → bullets → resume
- Parallel: select-exp, select-projects, select-skills run together
- Convergence: all three selection nodes merge before summary
- Total Nodes: 9
- Edges: 13 (including START/END)

Future Support:
- Conditional edges for ATS feedback loop
- Streaming execution for real-time updates
- Checkpointing for resumable workflows
`;
}
