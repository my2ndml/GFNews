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
    if (result.rss && result.rss.channel && result.rss.channel[0] && result.rss.channel[0].item) {
      const items = result.rss.channel[0].item;

      // Creazione di un array con le notizie
      const allItems = items.map(item => {
