# Round3 Fleet Telemetry Dashboard

A modern, responsive web application for monitoring vehicle fleets in real‑time. Built with **React**, **TypeScript**, **Vite**, **Tailwind CSS**, and the **shadcn/ui** component library, this project provides dashboards, alerts, vehicle management, and telemetry visualization backed by a RESTful API.

## 🚀 Features

- **Interactive dashboards** with charts and metrics
- Real‑time **vehicle telemetry** (temperature, RPM, speed, etc.)
- **Health scoring** and **fault log** tracking
- **Alerts panel** with unresolved/resolved filtering
- Vehicle **detail pages** with historical data
- Support for **adding and editing** vehicles
- Client‑side routing via `react-router-dom`
- Dark/light theme toggle with `next-themes`
- Smooth animations using `framer-motion`
- 3D vehicle hero scene powered by `react-three-fiber` and `three.js`
- Fully responsive and accessible UI built with Radix/Headless components

## 📦 Technology Stack

| Category | Tools & Libraries |
|----------|------------------|
| Framework | React 18 |
| Language | TypeScript |
| Build | Vite |
| Styling | Tailwind CSS, shadcn/ui |
| UI Primitives | Radix UI (@radix-ui/*) |
| State & Data | @tanstack/react-query, React Context |
| HTTP | Axios |
| Validation | Zod, react-hook-form |
| Charts | Recharts, lucide-react icons |
| 3D | three.js, @react-three/fiber, @react-three/drei |
| Animations | Framer Motion |
| Testing | Vitest, Testing Library |
| Linting | ESLint |
| Utilities | clsx, date-fns, sonner, tailwind-merge |
| Version control | Git (compatible with GitHub / Lovable) |

## 🗂️ Project Structure

```
├── public/                # Static assets
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── ui/            # shadcn‑ui primitives and wrappers
│   │   ├── motion/        # animation helpers
│   │   └── three/         # 3D scenes
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Shared utility functions
│   ├── pages/             # Route‑level page components
│   ├── services/          # API wrappers and type definitions
│   ├── test/              # Vitest setup and example tests
│   └── App.tsx            # Root component and router
├── package.json           # Dependencies & scripts
├── tsconfig.json          # TypeScript configuration
└── vite.config.ts         # Vite configuration
```

### Notable directories

- `src/pages/` contains each screen of the application (Dashboard, Vehicles, Alerts, etc.)
- `src/components/` houses both domain‑specific cards and shared UI primitives
- `src/services/api.ts` centralizes all network requests and TypeScript interfaces
- `src/hooks/` contains helpers like `useToast` and mobile detection

## 🛠️ Getting Started

1. **Clone the repository**

   ```bash
   git clone <YOUR_GIT_URL>
   cd round3
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:5173](http://localhost:5173) in your browser. Changes hot‑reload automatically.

## 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run build:dev` | Build with development mode |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint across project |
| `npm run test` | Run Vitest once |
| `npm run test:watch` | Watch tests in development |

## 🧪 Testing

- Setup in `src/test/setup.ts`.
- Example spec in `src/test/example.test.ts`.
- Use Vitest’s familiar `describe/it` API and Testing Library for DOM assertions.
- Run `npm run test` or `npm run test:watch` during development.

## 🧹 Linting & Formatting

- ESLint configured via `eslint.config.js` with React and TypeScript rules.
- Tailwind’s `@tailwindcss/typography` plugin is installed.
- Run `npm run lint` to catch issues early.

## 📐 Styling & UI

- Tailwind CSS is configured in `tailwind.config.ts`.
- UI primitives live under `src/components/ui`.
- Custom design patterns leverage `class-variance-authority` and `clsx`.
- Theme switching via `next-themes` integrated into `ThemeToggle`.

## 📁 API & Types

`src/services/api.ts` exports functions like `fetchVehicles`, `fetchTelemetry`, etc., each returning typed data:

```ts
type Vehicle = { id: string; vehicleId?: string; healthScore: number; ... };
```

Add new endpoints or types here when backend contract evolves.

## 📦 Deployment

Build for production:

```bash
npm run build
```

The output folder is `dist/`. Serve it with any static host (Vercel, Netlify, GitHub Pages, etc.).

> This project was originally scaffolded with Lovable; you can continue deploying through that platform or use standard GitHub workflows.

## 🧩 Extending the App

1. **New page**: Add file under `src/pages`, update router in `App.tsx`.
2. **New component**: Place in `src/components/` or `src/components/ui`.
3. **API call**: Extend `services/api.ts` and add corresponding types.
4. **Styling**: Use Tailwind utility classes or extend `tailwind.config.ts`.
5. **Animations**: Leverage `framer-motion` helpers in `src/components/motion`.

## 📚 Contribution Guidelines

- Follow existing code style and TypeScript strictness.
- Add tests for new functionality.
- Run lint and fix warnings before submitting PR.
- Use descriptive commit messages.

## 📝 License

Specify your license here (e.g., MIT) or remove this section as appropriate.

---

*Last updated: March 7, 2026*