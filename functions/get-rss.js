const axios = require('axios');
const { parseStringPromise } = require('xml2js');

exports.handler = async function(event, context) {
  const feedUrl = "https://www.google.com/alerts/feeds/16536343738982417073/13194083261960971336"; // URL del feed RSS/Atom

  try {
    const response = await axios.get(feedUrl);
    const xmlData = response.data;

    console.log("RSS/Atom Feed ricevuto:", xmlData); // Log del feed raw

    // Parsing del feed RSS/Atom
    const result = await parseStringPromise(xmlData);
    console.log("RSS/Atom Feed parsato:", JSON.stringify(result, null, 2)); // Log del risultato del parsing

    // Verifica se esiste il feed e la sezione 'entry' nel feed Atom
    if (result.feed && result.feed.entry) {
      const entries = result.feed.entry;

      // Creazione di un array con le notizie
      const allItems = entries.map(entry => {
        const title = entry.title[0];
        const link = entry.link[0].$.href; // L'URL del link si trova in `link.$.href`
        const description = entry.summary ? entry.summary[0] : ""; // La descrizione può essere in `summary`
        const pubDate = entry.updated ? entry.updated[0] : "Data non disponibile"; // La data si trova in `updated`

        // Estrarre l'immagine dalla descrizione, se presente
        const imageMatch = description.match(/<img[^>]+src="([^">]+)"/); // RegEx per cercare <img> e ottenere l'URL

        const image = imageMatch ? imageMatch[1] : "https://via.placeholder.com/150"; // Usa immagine di default se non trovata

        return {
          title: title,
          link: link,
          description: description,
          pubDate: pubDate,
          image: image
        };
      });

      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*" // Permette il CORS
        },
        body: JSON.stringify(allItems),
      };
    } else {
      console.error("Il feed non contiene 'entry'. Struttura del feed:", result);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "Feed Atom non valido", error: "Il feed non contiene la sezione 'entry'" }),
      };
    }

  } catch (error) {
    console.error("Errore durante il caricamento del feed:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Errore interno del server", error: error.message }),
    };
  }
};
