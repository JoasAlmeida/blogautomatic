import dotenv from 'dotenv';
import { fetchFeed } from './feeds.js';
import { rewriteWithClaude } from './claude.js';
import { publishToWordPress } from './wordpress.js';
import { initFirestore, isAlreadyProcessed, markProcessed } from './firestore.js';
import { isRelevant } from './filter.js';

dotenv.config();

const DRY_RUN = process.env.DRY_RUN === '1';

const FEEDS = [
  { url: 'https://g1.globo.com/rss/g1/ma/', source: 'G1 Maranhao' },
  { url: 'https://g1.globo.com/rss/g1/', source: 'G1' },
  { url: 'https://rss.uol.com.br/feed/noticias.xml', source: 'UOL' }
];

const MAX_PER_RUN = 5;

async function main() {
  console.log(`Iniciando ciclo${DRY_RUN ? ' (DRY RUN)' : ''}...`);
  initFirestore();

  let publishedCount = 0;

  for (const feed of FEEDS) {
    if (publishedCount >= MAX_PER_RUN) break;

    console.log(`\nLendo ${feed.source}...`);

    let items;
    try {
      items = await fetchFeed(feed.url);
    } catch (err) {
      console.error(`Falha ao ler ${feed.source}:`, err.message);
      continue;
    }

    console.log(`${items.length} itens no feed`);

    for (const item of items) {
      if (publishedCount >= MAX_PER_RUN) break;

      const guid = item.guid || item.link;

      if (await isAlreadyProcessed(guid)) continue;

      if (!isRelevant(item)) {
        await markProcessed(guid, feed.source, 'irrelevante');
        continue;
      }

      console.log(`\n> ${item.title}`);

      try {
        const rewritten = await rewriteWithClaude(item, feed.source);
        console.log(`  reescrito: ${rewritten.titulo}`);

        if (DRY_RUN) {
          console.log('  [DRY RUN] sem publicar');
          console.log(JSON.stringify(rewritten, null, 2));
          continue;
        }

        const post = await publishToWordPress(rewritten, item, feed.source);
        await markProcessed(guid, feed.source, 'publicado', post.id);
        console.log(`  publicado, ID ${post.id}, ${post.link}`);
        publishedCount++;

        await sleep(3000);
      } catch (err) {
        console.error(`  erro:`, err.message);
        await markProcessed(guid, feed.source, 'erro');
      }
    }
  }

  console.log(`\nCiclo concluido. Publicados: ${publishedCount}`);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

main().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
