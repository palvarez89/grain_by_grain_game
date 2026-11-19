# Grain by Grain

A 3D coastal incremental game built with React, TypeScript, Tailwind CSS, and Three.js. Start on a sunlit cove with a travel toothbrush, carve down 3D sand dunes, haul your load back to the Sell Silo, and upgrade your gear at the boardwalk Workshop.

## Play Online (GitHub Pages)

Once published via GitHub Actions, your live game is available at:

`https://<your-github-username>.github.io/<your-repo-name>/`

*(Replace `<your-github-username>` and `<your-repo-name>` with your GitHub account and repository name, or find the exact clickable link in your repo under **Settings → Pages** after the workflow runs.)*

## Gameplay Loop

1. **Sweep the Dunes**: Walk onto the 3D sand beach and sweep sand into your backpack, starting with a **Travel Toothbrush**. Look for buried coins, gems, and shells hidden beneath deep drifts.
2. **Sell at the West Silo**: When your backpack fills up, follow the golden guide arrow back to the **Sand Sell Silo** on the west boardwalk and press `E` to cash in your haul.
3. **Upgrade at the East Workshop**: Walk over to the **Gear & Crew Workshop** on the east boardwalk and press `F` to unlock:
   - **8 Sweeping Tools**: Travel Toothbrush → Straw Whisk Broom → Boardwalk Push Broom → Aluminum Sand Scoop → Gas Leaf Blower → Rotary Street Sweeper → Mini Sand Bulldozer → Solar Vortex Vacuum.
   - **6 Haul Packs**: Plastic Sand Pail up to Quantum Sand Compactor.
   - **6 Market Contracts**: Increase your payout per grain of sand.
   - **Autonomous Crew**: Trained Hermit Crabs, Boardwalk Helpers, Solar Sand-Bots, and Shoreline Vortex Drones that sweep dunes and deliver sand to the Silo.
4. **Clear All 5 Beaches**: Sweep 100% of **Pebble Cove**, **Shellfish Bay**, **Driftwood Point**, **Coral Shoals**, and **Golden Mirage Atoll**.

## Controls

| Input | Action |
| --- | --- |
| `W` `A` `S` `D` / Arrow Keys | Move character |
| `Shift` | Sprint |
| `Space` or Hold Left-Click | Sweep sand (click-hold also steers toward cursor) |
| Mouse Wheel | Zoom camera in / out |
| `E` | Sell sand (while at West Sell Silo) |
| `F` | Open / close Workshop (while at East Workshop) |
| `H` | Collapse / expand bottom HUD dock |
| `M` | Mute / unmute procedural sound effects |
| `Esc` | Pause / select unlocked beach |

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

### Scripts

- `npm run dev` — Start the Vite development server on port 3000
- `npm run lint` — Run TypeScript type-checking (`tsc --noEmit`)
- `npm run build` — Build the production bundle into `dist/`

## Deploying to GitHub Pages

This repository includes `.github/workflows/deploy.yml`, which automatically type-checks, builds `dist/`, and deploys to GitHub Pages on every push to `main`.

1. Push this repository to GitHub (`main` branch).
2. Open **Settings → Pages** in your GitHub repository.
3. Set **Build and deployment → Source** to **GitHub Actions**.
4. Update the Play Online URL at the top of this README with your live `github.io` link.
