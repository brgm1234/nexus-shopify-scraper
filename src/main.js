const { Actor } = require('apify');
const axios = require('axios');

Actor.main(async () => {
  const input = await Actor.getInput();
  const { storeUrls, maxProducts = 50 } = input;
  
  console.log('Starting Shopify scraper...');
  console.log('Store URLs:', storeUrls);
  console.log('Max products per store:', maxProducts);
  
  const results = [];
  const proxyConfiguration = await Actor.createProxyConfiguration({
    groups: ['BUYPROXIES94952']
  });
  
  for (const storeUrl of storeUrls) {
    let page = 1;
    let storeProducts = 0;
    
    while (storeProducts < maxProducts) {
      try {
        const productsUrl = storeUrl.endsWith('/') 
          ? `${storeUrl}products.json?page=${page}&limit=250`
          : `${storeUrl}/products.json?page=${page}&limit=250`;
        
        const response = await axios.get(productsUrl, {
          proxy: proxyConfiguration.createProxyUrl(),
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json'
          },
          timeout: 30000
        });
        
        const products = response.data?.products || [];
        
        if (products.length === 0) break;
        
        for (const product of products) {
          if (storeProducts >= maxProducts) break;
          
          const variants = product.variants || [];
          const prices = variants.map(v => parseFloat(v.price)).filter(p => !isNaN(p));
          const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
          const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
          
          results.push({
            id: product.id,
            title: product.title || '',
            vendor: product.vendor || '',
            variants: variants.map(v => ({
              id: v.id,
              title: v.title,
              price: v.price,
              available: v.available
            })),
            priceRange: minPrice === maxPrice ? `$${minPrice}` : `$${minPrice} - $${maxPrice}`,
            images: (product.images || []).map(img => img.src || img.url || ''),
            handle: product.handle || '',
            productUrl: storeUrl.endsWith('/') 
              ? `${storeUrl}products/${product.handle}`
              : `${storeUrl}/products/${product.handle}`,
            storeUrl,
            tags: product.tags || [],
            productType: product.product_type || ''
          });
          
          storeProducts++;
        }
        
        page++;
        await new Promise(resolve => setTimeout(resolve, 1500));
      } catch (error) {
        console.error(`Error scraping store "${storeUrl}" page ${page}:`, error.message);
        break;
      }
    }
  }
  
  await Actor.pushData(results);
  console.log('Scraping completed. Total results:', results.length);
});