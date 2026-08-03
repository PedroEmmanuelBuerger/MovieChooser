const ERROR_MESSAGES: Record<string, string> = {
  MISSING_API_KEY:
    "Configure a chave da API TMDB no arquivo .env para continuar.",
  UNAUTHORIZED:
    "A chave da API TMDB é inválida. Verifique o valor de VITE_TMDB_API_KEY.",
  NETWORK_ERROR:
    "Não foi possível conectar à TMDB. Verifique sua conexão com a internet.",
  TIMEOUT: "A consulta demorou demais. Tente sortear novamente.",
  RATE_LIMIT: "Muitas requisições em pouco tempo. Aguarde e tente de novo.",
  NOT_FOUND: "O recurso solicitado não foi encontrado na TMDB.",
  EMPTY_RESULTS:
    "Não encontramos títulos válidos para essa combinação. Tente outra plataforma ou tipo.",
  ALL_WATCHED:
    "Você já marcou todos os conteúdos encontrados como assistidos.",
  INVALID_ITEM: "O título sorteado estava incompleto. Tente novamente.",
  HTTP_ERROR: "A TMDB retornou um erro inesperado. Tente novamente.",
  UNKNOWN: "Ocorreu um erro inesperado ao buscar a recomendação.",
};

export function getFriendlyErrorMessage(
  code: string | undefined,
  fallback?: string,
): string {
  if (code) {
    const mapped = ERROR_MESSAGES[code];
    if (mapped) {
      return mapped;
    }
  }

  if (fallback && fallback.trim().length > 0) {
    return fallback;
  }

  return "Ocorreu um erro inesperado ao buscar a recomendação.";
}
