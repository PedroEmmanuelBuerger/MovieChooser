# MovieChooser

Aplicativo desktop Windows que recomenda filmes e séries/animes disponíveis em plataformas de streaming.

## Fluxo

1. Crie seu perfil local (nome, bio e avatar)
2. Escolha a plataforma (Netflix, HBO Max, Crunchyroll, Prime Video ou Disney+)
3. Escolha o tipo (Filme ou Série/Anime)
4. Escolha exatamente uma categoria (gênero) ou **Surpreenda-me**
5. Receba uma recomendação aleatória com opção de sortear novamente
6. Acompanhe o **Histórico**, marque **Assistidos** e veja estatísticas no **Perfil**
7. Em **Configurações**, opcionalmente evite recomendar conteúdos já assistidos

## Navegação

Sidebar fixa à esquerda:

- **Descobrir** — fluxo de recomendação
- **Histórico** — recomendações recebidas (abas Filmes / Séries e Animes)
- **Assistidos** — biblioteca local com nota do usuário
- **Perfil** — estatísticas, insights, rankings e conquistas
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
- Recharts
- Axios + TMDB API
- electron-store (histórico, assistidos, perfil, configurações e conquistas)
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
npm run test:profile
```

- `npm run build` — compila TypeScript, Vite e prepara assets Windows
- `npm run dist` — gera o instalador `MovieChooser-Setup-<versão>.exe` em `release/`
- `npm run test:profile` — valida perfil, estatísticas e conquistas

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
  context/      LibraryProvider + SettingsProvider + ProfileProvider
  data/         plataformas, tipos, conquistas e providers TMDB
  hooks/        useRecommendation, useHistory, useWatched, useSettings, useProfile, useStats
  services/     tmdb, recommendation, storage, settings, profile, stats
  types/        contratos TypeScript
  lib/          utils, motion, avatar e mensagens de erro
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
- O Perfil calcula estatísticas, top gêneros, plataformas, atividade mensal, tempo estimado (runtime TMDB), favoritos, insights e conquistas
- A chave TMDB é embutida no build do renderer (`VITE_TMDB_API_KEY`) no momento do `npm run build`
- Use Node 22+ se o Tailwind reportar problemas de binding nativo
