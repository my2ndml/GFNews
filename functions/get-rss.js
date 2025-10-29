const axios = require('axios');
const { parseStringPromise } = require('xml2js');

exports.handler = async function(event, context) {
  const feedUrl = "https://www.google.com/alerts/feeds/16536343738982417073/13194083261960971336"; // URL del feed RSS

  try {
    const response = await axios.get(feedUrl);
    const xmlData = response.data;

    console.log("RSS Feed ricevuto:", xmlData); // Log del feed raw

    // Parsing del feed RSS
    const result = await parseStringPromise(xmlData);
    console.log("RSS Feed parsato:", JSON.stringify(result, null, 2)); // Log del risultato del parsing

    // Verifica se esiste il canale nel feed
    if (result.feed && result.feed.entry) {
      const items = result.feed.entry;

      // Creazione di un array con le notizie
      const allItems = items.map(item => {
        const title = item.title[0] || "No Title";
        const link = item.link[0].$.href || "#";
        const description = item.summary ? item.summary[0] : "No Description available";
        const image = item.media$thumbnail ? item.media$thumbnail[0].$.url : "https://via.placeholder.com/250"; // Usa un'immagine placeholder se non esiste
        const pubDate = item.updated ? item.updated[0] : "Data non disponibile";

        return {
          title,
          link,
          description,
          image,
          pubDate
        };
      });

      return {
        statusCode: 200,
        body: JSON.stringify(allItems)
      };
    } else {
      return {
        statusCode: 400,
        body: "Feed non valido"
      };
    }
  } catch (error) {
    console.error("Errore durante il caricamento del feed:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Errore durante il caricamento del feed" })
    };
  }
};
