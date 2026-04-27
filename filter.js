// Filtra noticias por palavras-chave regionais.
// Edite a lista para ajustar o foco do blog.

const KEYWORDS = [
  'maranhao', 'maranhão',
  'sao luis', 'são luís', 'sao luís', 'são luis',
  'centro do guilherme',
  'imperatriz', 'caxias', 'timon',
  'codo', 'codó',
  'bacabal', 'paco do lumiar', 'paço do lumiar',
  'sao jose de ribamar', 'são josé de ribamar'
];

export function isRelevant(item) {
  const text = `${item.title || ''} ${item.contentSnippet || ''} ${item.contentEncoded || item.content || ''}`
    .toLowerCase();

  return KEYWORDS.some(k => text.includes(k));
}
