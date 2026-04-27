import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = 'claude-sonnet-4-6';

const SYSTEM_PROMPT = `Voce reescreve noticias para um blog regional do Maranhao, focado em Centro do Guilherme e Sao Luis.

ESTILO obrigatorio:
- Linguagem clara e simples
- Frases curtas
- Voz ativa
- Sem travessoes (use virgula)
- Sem ponto e virgula
- Sem markdown, hashtags, asteriscos
- Sem clichês, metaforas, generalizacoes
- Sem adjetivos vazios ou adverbios desnecessarios
- Proibido usar: pode, talvez, apenas, muito, realmente, literalmente, na verdade

CONTEUDO:
- Reescreva por completo, nunca copie trechos da fonte original
- Mantenha apenas fatos verificaveis presentes no texto fonte
- Nao invente dados, numeros, datas ou citacoes
- Se faltar informacao, escreva sem ela, nao preencha com suposicao
- Estrutura: lead com o fato principal no primeiro paragrafo, contexto no segundo, detalhes nos seguintes
- 3 a 6 paragrafos curtos
- Nao use a palavra "fonte" ou referencie o portal original no corpo

SAIDA: apenas JSON valido, sem texto antes nem depois, sem markdown, sem crases. Formato:
{
  "titulo": "string com no maximo 80 caracteres",
  "resumo": "string com 1 ou 2 frases, no maximo 160 caracteres",
  "corpo_html": "string com paragrafos em <p>...</p>, sem outras tags",
  "tags": ["3 a 5 tags em minusculas"],
  "categoria": "Maranhao | Sao Luis | Centro do Guilherme | Brasil"
}`;

export async function rewriteWithClaude(item, source) {
  const sourceText = stripHtml(item.contentEncoded || item.content || item.contentSnippet || '');

  const userMsg = `Fonte: ${source}
Titulo original: ${item.title}
Link: ${item.link}

Conteudo original:
${sourceText}

Reescreva conforme as regras. Devolva apenas o JSON.`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMsg }]
  });

  const text = response.content[0].text.trim();
  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`JSON invalido do Claude: ${cleaned.slice(0, 300)}`);
  }

  validate(parsed);
  return parsed;
}

function validate(obj) {
  const required = ['titulo', 'resumo', 'corpo_html', 'tags', 'categoria'];
  for (const key of required) {
    if (!obj[key]) throw new Error(`Campo ausente no JSON do Claude: ${key}`);
  }
  if (!Array.isArray(obj.tags)) throw new Error('tags deve ser array');
  if (obj.titulo.length > 80) throw new Error('titulo muito longo (max 80 chars)');
}

function stripHtml(html) {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 4000);
}
