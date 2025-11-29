// 3. Scrape Logic
  async function handleScrape() {
    if (!urlInput) return;
    setIsScraping(true);
    setScrapedData(null); // Reset previous data
    
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        body: JSON.stringify({ url: urlInput }),
      });
      
      const data = await res.json();

      if (!res.ok) {
        // If scraper failed (422 or 500), throw error to trigger catch block
        throw new Error(data.error || 'Scraping failed');
      }
      
      setScrapedData(data);
    } catch (err) {
      console.log("Scrape failed, falling back to manual entry.");
      // Fallback: Create a blank card so user can type manually
      setScrapedData({
        title: '',
        image: 'https://via.placeholder.com/400x300?text=Enter+Details',
        url: urlInput
      });
    } finally {
      setIsScraping(false);
    }
  }