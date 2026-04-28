// Lista de feeds e cota por categoria.
// Edite aqui sempre que quiser adicionar ou remover fonte.

export const FEEDS = [
  // Regional Maranhao
  { url: 'https://g1.globo.com/rss/g1/ma/', source: 'G1 Maranhao', category: 'regional' },
  { url: 'https://imirante.com/feed/', source: 'Imirante', category: 'regional' },
  { url: 'https://oimparcial.com.br/feed/', source: 'O Imparcial', category: 'regional' },
  { url: 'https://jornalpequeno.com.br/feed/', source: 'Jornal Pequeno', category: 'regional' },
  { url: 'https://omaranhense.com/feed/', source: 'O Maranhense', category: 'regional' },
  { url: 'https://maranhaohoje.com/feed/', source: 'Maranhao Hoje', category: 'regional' },

  // Futebol times do Maranhao
  { url: 'https://ge.globo.com/ma/futebol/rss.xml', source: 'GE Maranhao Futebol', category: 'futebol-ma' },

  // Futebol nacional
  { url: 'https://ge.globo.com/rss/futebol/brasileirao-serie-a/', source: 'GE Brasileirao', category: 'futebol-nacional' },
  { url: 'https://ge.globo.com/rss/futebol/copa-do-brasil/', source: 'GE Copa do Brasil', category: 'futebol-nacional' },
  { url: 'https://placar.com.br/feed', source: 'Placar', category: 'futebol-nacional' },

  // Selecao Brasileira
  { url: 'https://ge.globo.com/rss/futebol/selecao-brasileira/', source: 'GE Selecao', category: 'selecao' }
];

// Maximo de posts publicados por categoria em cada execucao do bot.
// Soma das cotas e o teto total do ciclo.
export const QUOTA = {
  regional: 3,
  'futebol-ma': 2,
  'futebol-nacional': 2,
  selecao: 1
};
