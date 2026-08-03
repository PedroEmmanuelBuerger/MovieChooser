# MovieChooser

Aplicativo desktop Windows que recomenda filmes e séries/animes disponíveis em plataformas de streaming.

## Fluxo

1. Escolha a plataforma (Netflix, HBO Max, Crunchyroll, Prime Video ou Disney+)
2. Escolha o tipo (Filme ou Série/Anime)
3. Escolha exatamente uma categoria (gênero) ou **Surpreenda-me**
4. Receba uma recomendação aleatória com opção de sortear novamente
5. Acompanhe o **Histórico** e marque títulos como **Assistidos** (com nota de 1 a 10)
6. Em **Configurações**, opcionalmente evite recomendar conteúdos já assistidos

## Navegação

Sidebar fixa à esquerda:

- **Descobrir** — fluxo de recomendação
- **Histórico** — recomendações recebidas (abas Filmes / Séries e Animes)
- **Assistidos** — biblioteca local com nota do usuário
- **Configurações** — preferências de recomendação

Os dados ficam neste dispositivo (sem login), via `electron-store` no processo principal do Electron.

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
- electron-store (histórico, assistidos e configurações)
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
npm run test:storage
npm run test:settings
```

- `npm run build` — compila TypeScript, Vite e prepara assets Windows
- `npm run dist` — gera o instalador `MovieChooser-Setup-<versão>.exe` em `release/`
- `npm run test:storage` — valida histórico, assistidos, nota e anti-duplicação
- `npm run test:settings` — valida persistência de `excludeWatched`

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
  context/      LibraryProvider + SettingsProvider
  data/         plataformas, tipos e providers TMDB
  hooks/        useRecommendation, useHistory, useWatched, useSettings
  services/     tmdb, recommendationService, storageService, settingsService
  types/        contratos TypeScript
  lib/          utils, motion e mensagens de erro
electron/
  main.ts       janela + IPC
  preload.ts    bridge segura
  storage.ts    persistência electron-store
build/
  icon.ico      ícone do instalador e do app
  icon.png      arte fonte do ícone
```

## Observações

- A busca usa `discover` da TMDB com `watch_region=BR` e `with_genres` (exceto no modo Surpreenda-me)
- O modo Surpreenda-me sorteia sem filtro de gênero, com mais variedade
- Itens sem título ou poster são ignorados no sorteio
- O botão “Sortear novamente” evita repetir títulos recentes
- Cada recomendação exibida entra automaticamente no Histórico
- Marcar como assistido não remove o item do Histórico e impede duplicatas em Assistidos
- Por padrão, conteúdos assistidos são excluídos do sorteio (`settings.excludeWatched = true`)
- Se todos os resultados já foram assistidos, o app oferece buscar mais páginas ou liberar assistidos só naquela tentativa
- A arquitetura já reserva campos futuros (notas, gêneros favoritos) sem ativá-los ainda
- A chave TMDB é embutida no build do renderer (`VITE_TMDB_API_KEY`) no momento do `npm run build`
- Use Node 22+ se o Tailwind reportar problemas de binding nativo
