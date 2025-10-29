const axios = require('axios');
const xml2js = require('xml2js'); // Libreria per il parsing del XML RSS

exports.handler = async function(event, context) {
    try {
        const feedUrl = 'https://www.google.com/alerts/feeds/16536343738982417073/13194083261960971336'; // URL del feed RSS
        const response = await axios.get(feedUrl);
        const xmlData = response.data;

        // Usa xml2js per parsare l'XML in un oggetto JavaScript
        const parser = new xml2js.Parser();
        const parsedData = await parser.parseStringPromise(xmlData);

        // Mappa i dati RSS nel formato che il frontend si aspetta
        const entries = parsedData.feed.entry || [];

        const newsItems = entries.map(entry => ({
            title: entry.title[0] || "No title available",
            link: entry.link[0].$.href || "#", // Estrai l'URL dal tag <link>
            content: entry.content[0] || "No Description available", // Estrai il contenuto (descrizione)
            published: entry.published[0], // La data di pubblicazione
            image: extractImage(entry.content[0]) // Funzione per estrarre l'immagine, se presente
        }));

        // Restituisci i dati in formato JSON
        return {
            statusCode: 200,
            body: JSON.stringify(newsItems)
        };

    } catch (error) {
        console.error("Errore durante il recupero del feed RSS:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Errore durante il caricamento del feed." })
        };
    }
};

// Funzione per estrarre un'immagine dal contenuto HTML (se presente)
function extractImage(content) {
    const imgRegex = /<img[^>]+src="([^">]+)"/; // Regex per trovare l'URL dell'immagine
    const matches = content.match(imgRegex);
    return matches ? matches[1] : null; // Ritorna l'URL dell'immagine se trovato, altrimenti null
}
