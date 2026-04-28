// Filtro por categoria.
// Cada categoria tem regra propria de relevancia.

const REGIONAL_KEYWORDS = [
  'maranhao', 'maranhão',
  'sao luis', 'são luís', 'sao luís', 'são luis',
  'centro do guilherme',
  'imperatriz', 'caxias', 'timon',
  'codo', 'codó',
  'bacabal', 'paco do lumiar', 'paço do lumiar',
  'sao jose de ribamar', 'são josé de ribamar',
  'acailandia', 'açailândia', 'balsas', 'pinheiro',
  'barra do corda', 'chapadinha', 'santa ines', 'santa inês'
];

// Times maranhenses e referencias do futebol local.
const FUTEBOL_MA_KEYWORDS = [
  'sampaio correa', 'sampaio corrêa', 'tubarao', 'tubarão',
  'moto club', 'moto', 'papao', 'papão',
  'maranhao atletico', 'maranhão atlético', 'maranhao ac', 'mac',
  'imperatriz', 'cavalo de aco', 'cavalo de aço',
  'tuntum', 'pinheiro futebol',
  'campeonato maranhense', 'estadual maranhense',
  'castelao', 'castelão', 'nhozinho santos'
];

export function isRelevant(item, category) {
  const text = `${item.title || ''} ${item.contentSnippet || ''} ${item.contentEncoded || item.content || ''}`.toLowerCase();

  switch (category) {
    case 'regional':
      return REGIONAL_KEYWORDS.some(k => text.includes(k));

    case 'futebol-ma':
      return FUTEBOL_MA_KEYWORDS.some(k => text.includes(k));

    case 'futebol-nacional':
    case 'selecao':
      // O feed ja vem filtrado pela editoria. Aceita tudo.
      return true;

    default:
      return false;
  }
}
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
