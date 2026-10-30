# Mesh / Minima

A simple, light-first optimization visualizer for GitHub Pages, consistent with Aiden Azarnoush’s other engineering tools.

Type a mathematical function, choose a starting point, and watch a point trace an optimizer's path across a rotatable mesh. No installation, build step, backend, fonts, external scripts, or API keys are needed. All calculations stay in the browser.

## Quick start

1. Choose an example or type your function.
2. Choose a method and starting coordinates, or use **Pick on mesh**.
3. Press **Start**. Drag the mesh to rotate; use the left/right buttons for simple rotation.
4. Pause or scrub the timeline to inspect the journey.

The default screen shows a white background, a plain mesh, and a small result strip. Axes, the floor grid, downhill arrows, and curvature coloring are off by default. These controls, multiple starting points, range, and data export live under **More options**. An optional dark mode is available in the header, and an explicit theme choice is remembered when browser storage is available.

The app detects coordinates from your function. With `x` and `y`, mesh height represents the function value. Add `z`, and it automatically displays level meshes in space and reveals the third starting coordinate. There is no dimension selector to configure.

The footer follows the Plasticity Yield Criteria tool: author, source repository, all repositories, portfolio, and the same PayPal coffee links.

## Explore

- **Two-variable height meshes:** enter `f(x,y)` and see the function's shape in 3D.
- **Three-variable level meshes:** enter `f(x,y,z)`, such as `x^2+y^2+z^2`, and see nested constant-value surfaces with a trajectory through coordinate space.
- **Four algorithms:** gradient descent, nonlinear conjugate gradient (Polak–Ribière+), BFGS, and damped Newton.
- **Choose the start:** type coordinates or select a nearby sampled point on the mesh.
- **Arrows at the current point:** the orange arrow shows the actual accepted search step chosen by the method; the dashed blue arrow shows the negative gradient. The visible arrow lengths are scaled; the magnitude numbers below the mesh are in the function’s coordinate units.
- **Optional downhill flow:** normalized negative-gradient arrows with moving tracers during playback.
- **Optional curvature:** color by the Laplacian, `trace(H)`. This scalar alone is not a minimum test.
- **Explore multiple minima:** launch 12 searches from deterministic starting points, group nearby candidate local minima, and inspect their coordinates and lowest candidate value.
- **Control time:** pause, replay, scrub the timeline, or change speed.
- **Export:** download actual accepted optimizer steps as JSON.
- Responsive layout, keyboard camera controls, and reduced-motion support.

Built-in examples: an anisotropic quadratic, Himmelblau’s four valleys, Rosenbrock, Rastrigin, a saddle, a two-variable two-valley surface, a three-variable quadratic, and three-variable twin wells. The descriptions next to the example selector explain what each view represents.

## Open locally

Open `index.html` in a modern browser. Alternatively, serve the directory with:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Publish on GitHub Pages

The included `publish.sh` creates the public `aiden-azarnoush/mesh-minima` repository, uploads the files, sets its description, website link and topics, and configures GitHub Pages to use `main` and the repository root. It can also publish later updates from the same checkout.

1. Install [Git](https://git-scm.com/install/) and the [GitHub CLI](https://cli.github.com/), and sign in to the `aiden-azarnoush` account:

   ```sh
   gh auth login
   ```

2. Extract the entire ZIP, open a terminal in the folder containing `index.html` and `publish.sh`, and run:

   ```sh
   bash publish.sh
   ```

   If Git asks for a name and email, configure them as shown in the script's message. The script will stop if signed into the wrong account, if required files are missing, or if the destination repository already exists and this checkout is not connected to it.

3. The script prints the repository and site links. GitHub Pages can take a few minutes to build. If automatic Pages setup fails after upload, rerun the script or choose **Settings → Pages → Deploy from a branch → main → / (root)** manually. GitHub's [Pages setup guide](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) has details.

Expected links after publication:

- Repository: https://github.com/aiden-azarnoush/mesh-minima
- Website: https://aiden-azarnoush.github.io/mesh-minima/
- Pages settings: https://github.com/aiden-azarnoush/mesh-minima/settings/pages

To publish changes later, edit the files in this same folder and run `bash publish.sh` again. The script commits and pushes the changes. It does not force-push or replace a different repository.

**Repository description:** Interactive 3D optimization visualizer: explore gradient descent, conjugate gradient, BFGS and Newton methods on custom functions.

**Topics:** `optimization`, `numerical-optimization`, `gradient-descent`, `conjugate-gradient`, `bfgs`, `newton-method`, `scientific-visualization`, `3d-visualization`, `javascript`, `github-pages`.

## Function syntax

Use `*` for multiplication and `^` for exponentiation. Unary minus follows exponentiation: `-x^2` means `-(x^2)`. Powers associate to the right: `2^3^2` means `2^(3^2)`.

Variables: `x`, `y`, and `z`. The view changes automatically when `z` is present. Constants: `pi`, `e`.

Functions: `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `sinh`, `cosh`, `exp`, `log`, `ln`, `sqrt`, `abs`. Two arguments: `pow`, `min`, `max`.

Examples:

```text
sin(x)*cos(y) + 0.1*(x^2 + y^2)
(x^2 - 1)^2 + y^2 + z^2
```

A small recursive-descent parser evaluates a restricted expression grammar. User expressions are never passed to `eval` or `Function`.

## What the visualization means

The mesh samples a continuous function. **The optimizers evaluate the continuous objective using numerical derivatives; they do not walk from mesh vertex to mesh vertex.** The point is animated between accepted steps. Its in-between positions are illustrative interpolation, not additional iterations. The dot and trail in the two-variable view are placed on the sampled mesh using bilinear height interpolation. Their numerical position and displayed objective value still come from the continuous function. The instantaneous gradient is evaluated at the interpolated coordinate; the method arrow remains the direction selected at the preceding accepted iterate until the next step.

The two-variable height axis uses a monotonic `asinh` transform to make steep and shallow regions readable together. Optimization, displayed objective values, gradients, and curvature all use the original objective. Extreme heights and non-finite mesh samples are omitted. Three-variable geometry uses marching tetrahedra on a sampled grid and is approximate. Its meshes are equal-value shells in coordinate space, so the point moves through them and need not lie on a shell.

The orange arrow at the moving point shows the method’s actual accepted search direction and accepted step (including any restart and line search). It stays fixed in coordinate space during each animated step. The dashed blue arrow shows the instantaneous negative gradient at the displayed point. Arrows are projected onto the displayed surface and their lengths are compressed for readability; the gradient magnitude and accepted step length are displayed numerically. When the directions agree, the arrows are offset slightly so both remain visible. The optional field of small arrows shows normalized negative gradients across the landscape. A trajectory follows accepted steps.

All methods use central finite-difference gradients and Armijo backtracking. Conjugate gradient uses PR+ with periodic and descent-direction restarts. BFGS updates an inverse-Hessian approximation with curvature safeguards. Newton uses finite-difference Hessians and shifts negative curvature before solving for a direction. Backtracking keeps accepted steps downhill; interpolated segments need not be monotonically downhill.

A point is labeled a **possible local minimum** only when its estimated gradient norm is below `1e-5`, derivative estimates at several step sizes agree within a numerical threshold, and its estimated Hessian eigenvalues are positive above a relative threshold. These checks can reduce false confidence but are not a mathematical proof; an approximate stationary point need not itself be an exact local minimum. Saddles, maxima, inconsistent numerical derivatives, inconclusive stationary points, invalid regions, plot boundaries, stalled searches, and iteration limits receive distinct statuses. Flat true minima may be labeled inconclusive. The derivative-consistency check cannot detect every numerical error. Finite-difference tests are numerical evidence, not mathematical proofs.

Searches stay inside the displayed coordinate range. A step may touch the edge and continue if the next search direction points inward; an infeasible direction can fall back to downhill before the search reports a boundary stop. They do not claim a constrained boundary optimum. Expand the range when a search reaches the boundary. Multi-start exploration is not a global optimization guarantee; “lowest candidate value” refers only to candidate minima found by those 12 starts. Candidate locations within 0.03 coordinate units are grouped, so nearby distinct minima can be counted together.

Smooth functions work best. Nonsmooth functions, discontinuities, singularities, very different coordinate scales, and narrow basins can defeat these educational implementations. They are not a substitute for a scientific optimization library.

Background reference on local minimization methods: https://docs.scipy.org/doc/scipy/reference/optimize.html

## Tests

Node.js is needed only for numerical tests:

```sh
npm test
# or:
node tests/optimizer.test.cjs
```

Tests cover expression precedence and rejection, derivatives, eigenvalues, four algorithms on anisotropic and multiwell objectives, Rosenbrock, three-variable optimization, saddle/maximum/flat-point classification, boundaries, invalid values, and multiple minima.

The interface was checked in Chrome at desktop and phone sizes, including plain quadratic rotation, rotation after point-picking or changing examples, rotation buttons, light/dark themes and saved preferences, automatic detection of z, both views, all methods, multi-start, curvature, playback, invalid input, reduced motion, JSON export, and offline standalone use.

## Files

- `index.html` — interface and content.
- `style.css` — responsive visual design.
- `app.js` — rendering, level meshes, interaction, and playback.
- `optimizer.js` — expression parser and numerical methods; usable in browsers or Node.
- `tests/optimizer.test.cjs` — numerical checks.
- `publish.sh` — creates or updates the public GitHub repository and sets up Pages.
- `LICENSE` — MIT license.

License: MIT.
