const axios = require('axios');
const { parseStringPromise } = require('xml2js');

exports.handler = async function(event, context) {
  const feedUrl = "https://www.google.com/alerts/feeds/16536343738982417073/13194083261960971336"; // URL del feed RSS

  try {
    const response = await axios.get(feedUrl);
    const xmlData = response.data;
    
    // Parsing del feed RSS
    const result = await parseStringPromise(xmlData);
    const items = result.rss.channel[0].item;
    
    // Creazione di un array con le notizie
    const allItems = items.map(item => {
      const description = item.description[0];
      const imageMatch = description.match(/<img[^>]+src="([^">]+)"/); // RegEx per cercare <img> e ottenere l'URL

      const image = imageMatch ? imageMatch[1] : "https://via.placeholder.com/150"; // Usa immagine di default se non trovata

      return {
        title: item.title[0],
        link: item.link[0],
        description: item.description[0],
        pubDate: item.pubDate[0],
        image: image
      };
    });

    // Restituzione della risposta in formato JSON
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*" // Permette il CORS
      },
      body: JSON.stringify(allItems),
    };
  } catch (error) {
    console.error("Errore durante il caricamento del feed:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Errore interno del server" }),
    };
  }
};
