'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import GiftCard from '@/components/GiftCard';
import { Plus, Loader2, Link as LinkIcon } from 'lucide-react';

export default function Home() {
  const [boards, setBoards] = useState([]);
  const [activeBoard, setActiveBoard] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Item State
  const [urlInput, setUrlInput] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedData, setScrapedData] = useState(null); // { title, image, url }

  // 1. Fetch Boards on Mount
  useEffect(() => {
    fetchBoards();
  }, []);

  // 2. Fetch Items when Active Board Changes
  useEffect(() => {
    if (activeBoard) fetchItems(activeBoard.id);
  }, [activeBoard]);

  async function fetchBoards() {
    const { data } = await supabase.from('boards').select('*').order('created_at');
    if (data && data.length > 0) {
      setBoards(data);
      setActiveBoard(data[0]);
    }
    setLoading(false);
  }

  async function fetchItems(boardId) {
    setLoading(true);
    const { data } = await supabase
      .from('items')
      .select('*')
      .eq('board_id', boardId)
      .order('created_at', { ascending: false });
    
    if (data) setItems(data);
    setLoading(false);
  }

  // 3. Scrape Logic
  async function handleScrape() {
    if (!urlInput) return;
    setIsScraping(true);
    
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        body: JSON.stringify({ url: urlInput }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setScrapedData(data);
    } catch (err) {
      alert('Failed to fetch product details. Try entering manually.');
    } finally {
      setIsScraping(false);
    }
  }

  // 4. Save Item Logic
  async function saveItem() {
    if (!scrapedData || !activeBoard) return;

    const { error } = await supabase.from('items').insert({
      board_id: activeBoard.id,
      title: scrapedData.title,
      image_url: scrapedData.image,
      product_url: scrapedData.url,
      status: 'to_buy'
    });

    if (!error) {
      setUrlInput('');
      setScrapedData(null);
      fetchItems(activeBoard.id); // Refresh list
    } else {
      alert('Error saving item');
    }
  }

  // 5. UI Update for Toggle & Notes
  const handleItemUpdate = (id, updatedFields) => {
    setItems((prev) => 
      prev.map(item => item.id === id ? { ...item, ...updatedFields } : item)
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header & Tabs */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-slate-800 mb-4 tracking-tight">GiftBoard</h1>
          
          {/* Scrollable Tabs */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {boards.map((board) => (
              <button
                key={board.id}
                onClick={() => setActiveBoard(board)}
                className={`
                  px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
                  ${activeBoard?.id === board.id 
                    ? 'bg-slate-900 text-white shadow-md' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}
                `}
              >
                {board.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        
        {/* Add Item Input Area */}
        <div className="mb-8 max-w-2xl mx-auto bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex gap-2">
          <div className="flex-1 flex items-center px-3 bg-slate-50 rounded-xl">
            <LinkIcon size={16} className="text-slate-400 mr-2" />
            <input
              type="url"
              placeholder="Paste product link here..."
              className="bg-transparent w-full py-3 text-sm outline-none text-slate-700 placeholder:text-slate-400"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScrape()}
            />
          </div>
          <button
            onClick={handleScrape}
            disabled={isScraping || !urlInput}
            className="bg-slate-900 text-white px-6 rounded-xl font-medium text-sm hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            {isScraping ? <Loader2 className="animate-spin" /> : 'Fetch'}
          </button>
        </div>

        {/* Scrape Preview Modal / Section */}
        {scrapedData && (
          <div className="mb-8 max-w-md mx-auto bg-white p-4 rounded-2xl shadow-lg border border-slate-100 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Preview</h3>
            <div className="flex gap-4 mb-4">
              <img src={scrapedData.image} alt="Preview" className="w-20 h-20 object-cover rounded-lg bg-slate-100" />
              <div className="flex-1">
                <input 
                  value={scrapedData.title} 
                  onChange={(e) => setScrapedData({...scrapedData, title: e.target.value})}
                  className="w-full text-sm font-semibold text-slate-800 border-b border-slate-200 pb-1 focus:border-blue-500 outline-none bg-transparent"
                />
                <p className="text-xs text-slate-400 mt-1 truncate">{scrapedData.url}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setScrapedData(null)} className="flex-1 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 rounded-lg">Cancel</button>
              <button onClick={saveItem} className="flex-1 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm">Add to Board</button>
            </div>
          </div>
        )}

        {/* Masonry Grid */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-300" size={32} /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <p>No items yet. Paste a link above to start!</p>
          </div>
        ) : (
          /* CSS Columns for Masonry Layout */
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {items.map((item) => (
              <GiftCard key={item.id} item={item} onUpdate={handleItemUpdate} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}