# Smart Water Distribution Network Optimization Using Graph Traversal and Minimum Spanning Trees

A high-performance, interactive 3D Web application engineered with **React 19, TypeScript, Vite, Tailwind CSS, and Three.js (`@react-three/fiber` + `@react-three/drei`)**, ready to deploy directly to **GitHub Pages**.

---

## 🌊 Overview & Engineering Context

Municipal water supply systems are capital-intensive civil engineering networks where transmission mains, secondary conduits, pressure-reducing valves, and distribution reservoirs must guarantee **uninterrupted supply** while **minimizing total capital expenditure (CapEx)** and avoiding redundant hydraulic loops.

This application provides a real-time, interactive computational environment that models water networks as weighted undirected graphs $G = (V, E)$ to solve three core optimization problems:

1. **Module 1 — Water Network Graph Construction & Live Topology Inspector:**
   - Insertion-ordered Adjacency List and Edge List representations.
   - Interactive Node and Pipeline editing with strict engineering validation (zero self-loops, positive weights, no duplicate edges).
2. **Module 2 — BFS-Based Source Connectivity & Wavefront Analysis:**
   - Evaluates whether municipal water stored in the primary reservoir reaches every consumer zone.
   - Computes wavefront hop distances, reachable ratio ($X / V$), identifies isolated zones, and logs FIFO queue progression.
3. **Module 3 — DFS-Based Network Exploration & Deep Trunk Traversal:**
   - Explores primary high-capacity transmission trunks first using depth-first search with explicit backtracking tracking and active branch visualization.
4. **Module 4 — Kruskal MST-Based Pipe Cost Optimization:**
   - Employs Kruskal's algorithm with **Disjoint-Set Union (DSU with Path Compression & Union by Rank)** to eliminate costly hydraulic cycles while ensuring every junction remains connected at minimal construction cost ($V - 1$ pipes).

---

## 🎨 Hydro-Engineering Abyssal & Copper Visual Palette

The visual design avoids generic AI gradients in favor of an authentic hydraulic engineering aesthetic:

| Component | Color Hex / Value | Purpose |
| :--- | :--- | :--- |
| **Primary Canvas / 3D Void** | `#0B1519` | Deep Abyssal Slate with concentric blueprint rings and ground grid |
| **Blueprint Grid** | `#12232B` & `#24424F` | Precision planar grid and depth reference |
| **Glassmorphic UI Panels** | `rgba(16, 32, 39, 0.85)` | Frosted Deep Teal-Slate with crisp 1px `#24424F` border |
| **Primary Text / Labels** | `#EDF2F4` & `#8FA6B2` | Mineral Off-White and Muted Mist |
| **Source / Reservoir Node** | `#E07A5F` | Warm Terracotta Copper 3D elevated water tower with support stilts and pulsing beacon ring |
| **Active Water / Selected MST Pipes** | `#00C49A` | Bioluminescent Aquamarine 3D conduits with animated traveling water particles |
| **BFS/DFS Active Frontier & Testing** | `#F2B84B` | Sunlit Amber highlighting active wavefronts, current queue candidates, and branches |
| **Rejected / Cycle Pipes** | `#3B5563` | Muted Steel-Slate semi-transparent links |
| **Disconnected / Isolated Nodes** | `#E63946` | Coral Crimson pulsing alert |
| **Typography** | `Plus Jakarta Sans`, `Space Grotesk`, `JetBrains Mono` | Engineering sans for headings + monospace for metrics & logs |

---

## 📊 Preloaded Benchmark 6-Node Dataset Verification

On initial load, the system preloads the verified 6-node hydraulic network:

- **Vertices ($V=6$):**
  - `A`: Reservoir Alpha (Elevated Source)
  - `B`: Pumping Station Beta
  - `C`: Distribution Hub Gamma
  - `D`: Pressure Reducer Delta
  - `E`: Sub-Junction Epsilon
  - `F`: Terminal Outlet Zeta
- **Pipelines ($E=9$):**
  - `A–B (4)`, `A–C (3)`, `B–C (2)`, `B–D (5)`, `C–D (3)`, `C–E (6)`, `D–E (2)`, `D–F (4)`, `E–F (3)`

### Verification Output:
- **BFS Traversal Order:** `A → B → C → D → E → F` (6/6 reachable, 100% water security)
- **DFS Traversal Order:** `A → B → D → F → E → C` (6/6 visited, trunk depth priority)
- **Selected MST Pipes:**
  1. `B–C` (Weight: 2) — Accepted ✓
  2. `D–E` (Weight: 2) — Accepted ✓
  3. `A–C` (Weight: 3) — Accepted ✓
  4. `C–D` (Weight: 3) — Accepted ✓
  5. `E–F` (Weight: 3) — Accepted ✓
  - **Total Optimal MST Cost:** **13 units** ($5 = V - 1$ conduits)
  - Candidate pipes `A–B (4)`, `D–F (4)`, `B–D (5)`, and `C–E (6)` rejected as redundant hydraulic loops.

---

## 🚀 GitHub Pages Automated Deployment

This repository includes:
1. `vite.config.ts` configured with `base: './'` for relative path resolution on GitHub Pages.
2. `.github/workflows/deploy.yml` GitHub Actions CI/CD workflow.

### To Deploy:
1. Initialize your git repository and push to GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: initial commit of 3D smart water distribution network"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
2. In your GitHub repository:
   - Navigate to **Settings** → **Pages**.
   - Under **Build and deployment** → **Source**, select **GitHub Actions**.
3. Pushing commits to `main` will automatically build and deploy your site to `https://<your-username>.github.io/<your-repo-name>/`.

---

## 💻 Local Development

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Run production build & verify TypeScript types
npm run build

# Preview production build locally
npm run preview
```

---

## 📝 Engineering Scope Disclaimer

> *This prototype optimizes graph connectivity and edge weights only; hydraulic pressure, head loss (Hazen-Williams / Darcy-Weisbach), flow velocity, water demand profiles, and pipe diameter constraints are not dynamically simulated.*
