# MovieChooser

Aplicativo desktop Windows que recomenda filmes e séries/animes disponíveis em plataformas de streaming.

## Requisitos

- Node.js 20+

## Stack

- Electron
- React
- TypeScript
- Vite
- TailwindCSS
- shadcn/ui
- Framer Motion
- Lucide React

## Configuração

Copie `.env.example` para `.env` e preencha a chave da API TMDB:

```bash
cp .env.example .env
```

```env
VITE_TMDB_API_KEY=sua_chave_aqui
VITE_TMDB_BASE_URL=https://api.themoviedb.org/3
```

## Scripts

```bash
npm install
npm run electron:dev
npm run typecheck
npm run lint
npm run build
npm run test:tmdb
```
