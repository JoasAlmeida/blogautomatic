# news-bot

Bot que le RSS de portais, filtra por relevancia regional, reescreve com Claude e publica no WordPress.

## Arquitetura

```
RSS -> Filtro regional -> Firestore (dedup) -> Claude (reescrita) -> WordPress REST API
```

Roda via GitHub Actions a cada 30 minutos. Custo zero de servidor.

## Estrutura

```
src/
  index.js       orquestrador
  feeds.js       leitura de RSS
  firestore.js   deduplicacao
  filter.js      filtro por palavras-chave
  claude.js      reescrita via Claude
  wordpress.js   publicacao via REST API
.github/workflows/
  publish.yml    cron do GitHub Actions
```

## Setup, passo a passo

### 1. Clonar e instalar

```bash
git clone <seu-repo>
cd news-bot
npm install
cp .env.example .env
```

### 2. Application Password no WordPress

1. Entre no admin do WordPress
2. Usuarios, Editar Perfil
3. Role ate "Senhas de Aplicativos"
4. Crie uma senha com nome "news-bot"
5. Copie a senha gerada (formato: xxxx xxxx xxxx xxxx xxxx xxxx)
6. Cole em WP_APP_PASSWORD no .env

A REST API ja vem ativa por padrao no WordPress.

### 3. Firebase Service Account

1. Console Firebase, projeto, Configuracoes, Contas de Servico
2. Gerar nova chave privada, baixa um JSON
3. Cole o JSON inteiro em uma linha so em FIREBASE_SERVICE_ACCOUNT no .env
4. Crie a colecao "news_published" no Firestore (cria sozinho no primeiro insert)

### 4. Anthropic API Key

1. console.anthropic.com
2. API Keys, Create Key
3. Cole em ANTHROPIC_API_KEY no .env

### 5. Testar local sem publicar

```bash
npm run dry
```

Le os feeds, filtra, reescreve e imprime o JSON. Nao envia ao WordPress.

### 6. Rodar de verdade

```bash
npm start
```

### 7. Subir para producao no GitHub Actions

1. Crie um repositorio privado no GitHub e suba o codigo
2. Settings, Secrets and variables, Actions
3. Adicione cada secret:
   - ANTHROPIC_API_KEY
   - WP_URL
   - WP_USER
   - WP_APP_PASSWORD
   - FIREBASE_SERVICE_ACCOUNT
4. Actions, Publicar noticias, Run workflow para testar
5. Depois ele roda sozinho a cada 30 minutos

## Configuracao

### Mudar feeds

Edite `FEEDS` em `src/index.js`. Adicione mais URLs:

```js
const FEEDS = [
  { url: 'https://outroportal.com/rss', source: 'Nome' }
];
```

### Mudar palavras-chave do filtro

Edite `KEYWORDS` em `src/filter.js`. Quanto mais especifico, menos ruido.

### Limite por execucao

Variavel `MAX_PER_RUN` em `src/index.js`. Padrao 5. Aumenta se quiser mais volume.

### Mudar o estilo da reescrita

Edite `SYSTEM_PROMPT` em `src/claude.js`. As regras de estilo estao todas la.

### Trocar o modelo do Claude

Constante `MODEL` em `src/claude.js`. Opcoes:
- `claude-sonnet-4-6` (padrao, qualidade alta)
- `claude-haiku-4-5-20251001` (mais barato e rapido)
- `claude-opus-4-7` (qualidade maxima, mais caro)

## Custo estimado

- GitHub Actions: gratis dentro de 2000 minutos por mes
- Firestore: gratis no Spark plan ate 50 mil leituras por dia
- Claude Sonnet: cerca de 3 dolares por milhao de tokens de input, 15 dolares por milhao de output
- WordPress: voce ja paga

Em volume tipico de blog regional, fica abaixo de 5 dolares por mes no Claude.

## Proximos passos sugeridos

- Gerar imagem do card com Imagen ou DALL-E quando o RSS nao tiver featured
- Postar tambem no Instagram via Make.com depois de publicar no WordPress
- Adicionar painel admin para revisar antes de publicar (status draft em vez de publish)
- Trocar dedup do Firestore por arquivo JSON commitado se quiser zero dependencias
