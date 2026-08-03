# MovieChooser

Aplicativo desktop Windows que recomenda filmes e séries/animes disponíveis em plataformas de streaming.

## Fluxo

1. Escolha a plataforma (Netflix, HBO Max, Crunchyroll, Prime Video ou Disney+)
2. Escolha o tipo (Filme ou Série/Anime)
3. Receba uma recomendação aleatória com opção de sortear novamente

## Requisitos

- Node.js 20+
- Conta e chave de API na [TMDB](https://www.themoviedb.org/settings/api)

## Stack

- Electron
- React
- TypeScript
- Vite
- TailwindCSS
- shadcn/ui
- Framer Motion
- Lucide React
- Axios + TMDB API
- electron-builder (instalador Windows)

## Configuração

```bash
nvm use
npm install
cp .env.example .env
```

Preencha a chave no `.env`:

```env
VITE_TMDB_API_KEY=sua_chave_aqui
VITE_TMDB_BASE_URL=https://api.themoviedb.org/3
```

## Scripts

```bash
npm run electron:dev
npm run typecheck
npm run lint
npm run build
npm run dist
npm run test:tmdb
npm run test:recommendation
```

- `npm run build` — compila TypeScript, Vite e prepara assets Windows
- `npm run dist` — gera o instalador `MovieChooser-Setup-<versão>.exe` em `release/`

## Distribuição Windows

O empacotamento usa `electron-builder` com alvo NSIS:

- Nome do aplicativo: **MovieChooser**
- Ícone: `build/icon.ico`
- Artefato: `release/MovieChooser-Setup-0.1.0.exe`

```bash
npm run dist
```

## Estrutura

```text
src/
  components/   telas e UI (shadcn)
  data/         plataformas, tipos e providers TMDB
  hooks/        useRecommendation
  services/     tmdb + recommendationService
  types/        contratos TypeScript
  lib/          utils, motion e mensagens de erro
build/
  icon.ico      ícone do instalador e do app
  icon.png      arte fonte do ícone
```

## Observações

- A busca usa `discover` da TMDB com `watch_region=BR`
- Itens sem título ou poster são ignorados no sorteio
- O botão “Sortear novamente” evita repetir títulos recentes
- A chave TMDB é embutida no build do renderer (`VITE_TMDB_API_KEY`) no momento do `npm run build`
- Use Node 22+ se o Tailwind reportar problemas de binding nativo
