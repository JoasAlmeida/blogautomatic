import Parser from 'rss-parser';

const parser = new Parser({
  timeout: 15000,
  customFields: {
    item: [
      ['media:content', 'mediaContent', { keepArray: false }],
      ['media:thumbnail', 'mediaThumbnail', { keepArray: false }],
      ['content:encoded', 'contentEncoded']
    ]
  }
});

export async function fetchFeed(url) {
  const feed = await parser.parseURL(url);
  return feed.items.slice(0, 15);
}
