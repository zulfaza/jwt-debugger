# JWT Debugger

A modern web app for decoding, editing, and verifying JSON Web Tokens (JWT) using React, TypeScript, and Vite.

## Features

- **Decode JWTs**: Instantly decode and view JWT header and payload.
- **Edit Payload**: Modify the payload and generate a new JWT.
- **Signature Verification**: Verify JWT signatures using HS256 and a custom secret.
- **Live Feedback**: See validation results and errors in real time.
- **Copy to Clipboard**: Easily copy JWTs and payloads.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [pnpm](https://pnpm.io/) or [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/your-username/jwt-debugger.git
cd jwt-debugger
pnpm install
# or
npm install
# or
yarn install
```

### Running the App

Start the development server:

```bash
pnpm dev
# or
npm run dev
# or
yarn dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to use the app.

### Building for Production

```bash
pnpm build
# or
npm run build
# or
yarn build
```

## Project Structure

- `src/` — Main source code
  - `App.tsx` — Main application component
  - `components/` — UI components
  - `lib/jwt/hs256/` — JWT HS256 generation and verification logic
- `public/` — Static assets

## Development

- Built with [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), and [Vite](https://vitejs.dev/)
- ESLint and Prettier for code quality and formatting

## License

MIT
