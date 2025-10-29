const axios = require("axios");
const { parseStringPromise } = require("xml2js");

// URL del feed RSS
const RSS_FEEDS = [
  "https://www.google.com/alerts/feeds/16536343738982417073/13194083261960971336"
];

async function fetchFeed(url) {
  const res = await axios.get(url, { timeout: 10000, responseType: "text" });
  const xml = res.data;
  return await parseStringPromise(xml, { explicitArray: false, mergeAttrs: true });
}

function extractItemsFromParsed(parsed) {
  if (parsed.feed && parsed.feed.entry) {
    const entries = Array.isArray(parsed.feed.entry) ? parsed.feed.entry : [parsed.feed.entry];
    return entries.map(e => ({
      title: e.title?._ || e.title || "",
      link: (e.link && (e.link.href || e.link)) || (e.id && e.id._) || "",
      content: e.content?._ || e.summary?._ || e.content || "",
      pubDate: e.updated || e.published || e.pubDate || ""
    }));
  }

  if (parsed.rss && parsed.rss.channel && parsed.rss.channel.item) {
    const items = Array.isArray(parsed.rss.channel.item) ? parsed.rss.channel.item : [parsed.rss.channel.item];
    return items.map(i => ({
      title: i.title || "",
      link: i.link || (i.enclosure && i.enclosure.url) || "",
      content: i.description || i["content:encoded"] || "",
      pubDate: i.pubDate || ""
    }));
  }

  return [];
}

function findImageInHtml(html) {
  if (!html) return null;
  const m = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
  if (m) return m[1];
  const urlMatch = html.match(/https?:\/\/[^'"\s>]+\.(?:png|jpg|jpeg|gif|webp)/i);
  if (urlMatch) return urlMatch[0];
  return null;
}

exports.handler = async function(event, context) {
  try {
    const allItems = [];

    for (const feedUrl of RSS_FEEDS) {
      const parsed = await fetchFeed(feedUrl);
      const items = extractItemsFromParsed(parsed);

      for (const it of items) {
        let image = null;
        if (it.enclosure && it.enclosure.url) image = it.enclosure.url;
        if (!image) image = findImageInHtml(it.content);
        allItems.push({
          title: it.title || "",
          link: it.link || "",
          content: it.content || "",
          pubDate: it.pubDate || "",
          image: image || null
        });
      }
    }

    allItems.sort((a, b) => {
      const da = new Date(a.pubDate || 0).getTime();
      const db = new Date(b.pubDate || 0).getTime();
      return db - da;
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify(allItems)
    };
  } catch (err) {
    console.error("get-rss error:", err && err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Errore nel recupero del feed" })
    };
  }
};
