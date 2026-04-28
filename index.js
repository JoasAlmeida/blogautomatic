import dotenv from 'dotenv';
import { fetchFeed } from './feeds.js';
import { rewriteWithClaude } from './claude.js';
import { publishToWordPress } from './wordpress.js';
import { initFirestore, isAlreadyProcessed, markProcessed } from './firestore.js';
import { isRelevant } from './filter.js';
import { FEEDS, QUOTA } from './feeds.config.js';

dotenv.config();

const DRY_RUN = process.env.DRY_RUN === '1';

async function main() {
  console.log(`Iniciando ciclo${DRY_RUN ? ' (DRY RUN)' : ''}...`);
  initFirestore();

  // Contador de publicados por categoria.
  const counters = Object.fromEntries(Object.keys(QUOTA).map(c => [c, 0]));

  for (const feed of FEEDS) {
    const cat = feed.category;
    const limit = QUOTA[cat] ?? 0;

    if (counters[cat] >= limit) {
      console.log(`\nPulando ${feed.source}, cota de ${cat} cheia.`);
      continue;
    }

    console.log(`\nLendo ${feed.source} [${cat}]...`);

    let items;
    try {
      items = await fetchFeed(feed.url);
    } catch (err) {
      console.error(`Falha ao ler ${feed.source}:`, err.message);
      continue;
    }

    console.log(`${items.length} itens no feed`);

    for (const item of items) {
      if (counters[cat] >= limit) break;

      const guid = item.guid || item.link;
      if (await isAlreadyProcessed(guid)) continue;

      if (!isRelevant(item, cat)) {
        await markProcessed(guid, feed.source, 'irrelevante');
        continue;
      }

      console.log(`\n> ${item.title}`);

      try {
        const rewritten = await rewriteWithClaude(item, feed.source, cat);
        console.log(`  reescrito: ${rewritten.titulo}`);

        if (DRY_RUN) {
          console.log('  [DRY RUN] sem publicar');
          console.log(JSON.stringify(rewritten, null, 2));
          await markProcessed(guid, feed.source, 'dry-run');
          continue;
        }

        const post = await publishToWordPress(rewritten, item, feed.source);
        await markProcessed(guid, feed.source, 'publicado', post.id);
        console.log(`  publicado, ID ${post.id}, ${post.link}`);

        counters[cat]++;
        await sleep(3000);
      } catch (err) {
        console.error('  erro:', err.message);
        await markProcessed(guid, feed.source, 'erro');
      }
    }
  }

  const total = Object.values(counters).reduce((a, b) => a + b, 0);
  console.log(`\nCiclo concluido. Total publicado: ${total}`);
  for (const [cat, n] of Object.entries(counters)) {
    console.log(`  ${cat}: ${n}/${QUOTA[cat]}`);
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

main().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
