const axios = require('axios');
const { parseStringPromise } = require('xml2js');

exports.handler = async function(event, context) {
  const feedUrl = "https://www.google.com/alerts/feeds/16536343738982417073/13194083261960971336"; // URL del feed RSS

  try {
    // Ottieni il feed RSS come XML
    const response = await axios.get(feedUrl);
    const xmlData = response.data;

    console.log("RSS Feed ricevuto:", xmlData); // Log del feed raw

    // Parsing del feed RSS (Atom) usando xml2js
    const result = await parseStringPromise(xmlData);
    console.log("RSS Feed parsato:", JSON.stringify(result, null, 2)); // Log del risultato del parsing

    // Verifica se la struttura è corretta per un feed Atom
    if (result.feed && result.feed.entry) {
      const entries = result.feed.entry;

      // Mappa per estrarre solo i dati rilevanti (titolo, descrizione, data, link)
      const allItems = entries.map(entry => {
        return {
          title: entry.title[0] || "No title available", // Titolo
          description: entry.summary ? entry.summary[0] : "No Description available", // Descrizione
          link: entry.link[0].$.href || "#", // Link all'articolo
          pubDate: entry.updated[0] || "No date available", // Data di pubblicazione
        };
      });

      // Restituisci i dati come risposta JSON
      return {
        statusCode: 200,
        body: JSON.stringify(allItems), // Risposta JSON con l'array degli articoli
      };
    } else {
      throw new Error("Feed non contiene 'entry' o 'feed'. Struttura non valida.");
    }
  } catch (error) {
    console.error("Errore durante il caricamento del feed:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Errore durante il caricamento del feed", error: error.message }),
    };
  }
};
