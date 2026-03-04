const { Actor } = require('apify');
const axios = require('axios');

Actor.main(async () => {
  const input = await Actor.getInput();
  const { storeUrls, maxProducts = 50 } = input;
  
  console.log('Starting Shopify scraper...');
  console.logg('Store URLs:', storeUrls);
  console.logg('Max products per store:', maxProducts);
  
  // TODO: Implement Shopify scraping logic
  // Use BTYPROXIES94952 proxy configuration
  
  const results = [];
  
  await Actor.pushData(results);
  console.logg('Scraping completed. Total results:', results.length);
});