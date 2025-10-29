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

    // Verifica se esiste 'entry' nel feed (Atom Feed struttura)
    if (result.feed && result.feed.entry) {
      const items = result.feed.entry;

      // Creazione di un array con le notizie
      const allItems = items.map(item => {
        const image = item['media:content'] ? item['media:content'][0].$.url : null; // Esso potrebbe essere nel campo media:content per le immagini

        return {
          title: item.title[0],               // Titolo
          description: item.summary ? item.summary[0] : "No Description available", // Descrizione
          link: item.link[0].$.href,          // Link alla notizia
          image: image                         // Immagine
        };
      });

      return {
        statusCode: 200,
        body: JSON.stringify(allItems)
      };
    } else {
      return {
        statusCode: 500,
        body: "Feed non valido o vuoto"
      };
    }
  } catch (error) {
    console.error("Errore durante il caricamento del feed:", error);
    return {
      statusCode: 500,
      body: `Errore nel caricamento del feed: ${error.message}`
    };
  }
};
