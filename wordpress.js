import axios from 'axios';

const WP_URL = process.env.WP_URL?.replace(/\/$/, '');
const WP_USER = process.env.WP_USER;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;

const auth = { username: WP_USER, password: WP_APP_PASSWORD };

export async function publishToWordPress(rewritten, original, source) {
  if (!WP_URL || !WP_USER || !WP_APP_PASSWORD) {
    throw new Error('Variaveis WP_URL, WP_USER ou WP_APP_PASSWORD nao definidas');
  }

  const categoryId = await getOrCreateCategory(rewritten.categoria);
  const tagIds = (await Promise.all(rewritten.tags.map(getOrCreateTag))).filter(Boolean);

  let featuredMediaId = null;
  const imageUrl = extractImageUrl(original);
  if (imageUrl) {
    featuredMediaId = await uploadMedia(imageUrl, rewritten.titulo);
  }

  const payload = {
    title: rewritten.titulo,
    excerpt: rewritten.resumo,
    content: rewritten.corpo_html + buildSourceFooter(original, source),
    status: 'publish',
    categories: [categoryId],
    tags: tagIds
  };

  if (featuredMediaId) payload.featured_media = featuredMediaId;

  const res = await axios.post(`${WP_URL}/wp-json/wp/v2/posts`, payload, { auth });
  return res.data;
}

function buildSourceFooter(original, source) {
  return `\n<p><em>Com informacoes de <a href="${original.link}" target="_blank" rel="noopener nofollow">${source}</a>.</em></p>`;
}

function extractImageUrl(item) {
  if (item.enclosure?.url) return item.enclosure.url;
  if (item.mediaContent?.$?.url) return item.mediaContent.$.url;
  if (item.mediaThumbnail?.$?.url) return item.mediaThumbnail.$.url;

  const html = item.contentEncoded || item.content || '';
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

async function uploadMedia(imageUrl, title) {
  try {
    const imageRes = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 15000
    });
    const buffer = Buffer.from(imageRes.data);
    const ext = guessExtension(imageRes.headers['content-type']);
    const filename = `news-${Date.now()}.${ext}`;

    const res = await axios.post(
      `${WP_URL}/wp-json/wp/v2/media`,
      buffer,
      {
        auth,
        headers: {
          'Content-Type': imageRes.headers['content-type'] || 'image/jpeg',
          'Content-Disposition': `attachment; filename="${filename}"`
        },
        maxBodyLength: Infinity
      }
    );

    await axios.post(
      `${WP_URL}/wp-json/wp/v2/media/${res.data.id}`,
      { title, alt_text: title, caption: '' },
      { auth }
    );

    return res.data.id;
  } catch (err) {
    console.warn('  upload da imagem falhou:', err.message);
    return null;
  }
}

function guessExtension(contentType = '') {
  if (contentType.includes('png')) return 'png';
  if (contentType.includes('webp')) return 'webp';
  if (contentType.includes('gif')) return 'gif';
  return 'jpg';
}

const categoryCache = new Map();
async function getOrCreateCategory(name) {
  if (categoryCache.has(name)) return categoryCache.get(name);

  const search = await axios.get(
    `${WP_URL}/wp-json/wp/v2/categories?search=${encodeURIComponent(name)}&per_page=20`,
    { auth }
  );
  const exact = search.data.find(c => c.name.toLowerCase() === name.toLowerCase());
  if (exact) {
    categoryCache.set(name, exact.id);
    return exact.id;
  }

  const created = await axios.post(`${WP_URL}/wp-json/wp/v2/categories`, { name }, { auth });
  categoryCache.set(name, created.data.id);
  return created.data.id;
}

const tagCache = new Map();
async function getOrCreateTag(name) {
  try {
    if (tagCache.has(name)) return tagCache.get(name);

    const search = await axios.get(
      `${WP_URL}/wp-json/wp/v2/tags?search=${encodeURIComponent(name)}&per_page=20`,
      { auth }
    );
    const exact = search.data.find(t => t.name.toLowerCase() === name.toLowerCase());
    if (exact) {
      tagCache.set(name, exact.id);
      return exact.id;
    }

    const created = await axios.post(`${WP_URL}/wp-json/wp/v2/tags`, { name }, { auth });
    tagCache.set(name, created.data.id);
    return created.data.id;
  } catch {
    return null;
  }
}
