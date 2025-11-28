'use client';

import { ExternalLink, Check, ShoppingCart, Pencil } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export default function GiftCard({ item, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [note, setNote] = useState(item.note || '');
  
  const isPurchased = item.status === 'purchased';

  // Toggle Buy/Purchased Status
  const toggleStatus = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setLoading(true);
    const newStatus = isPurchased ? 'to_buy' : 'purchased';

    const { error } = await supabase
      .from('items')
      .update({ status: newStatus })
      .eq('id', item.id);

    if (!error) {
      onUpdate(item.id, { ...item, status: newStatus });
    }
    setLoading(false);
  };

  // Save Note Logic
  const saveNote = async () => {
    setIsEditing(false);
    // Only save if the text actually changed
    if (note !== item.note) {
      const { error } = await supabase
        .from('items')
        .update({ note: note })
        .eq('id', item.id);
      
      if (!error) {
        // Update local state in parent if needed, or just keep local
        onUpdate(item.id, { ...item, note: note });
      }
    }
  };

  return (
    <div className="break-inside-avoid mb-4 group relative rounded-2xl bg-white shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-slate-100 flex flex-col">
      
      {/* Clickable Image Area */}
      <a 
        href={item.product_url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="block relative"
      >
        <img
          src={item.image_url}
          alt={item.title}
          className={clsx(
            "w-full h-auto object-cover transition-opacity duration-300",
            isPurchased ? "opacity-50 grayscale" : "opacity-100"
          )}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <ExternalLink className="text-white drop-shadow-md" />
        </div>
      </a>

      {/* Card Content */}
      <div className="p-4 flex flex-col gap-3 flex-grow">
        <h3 className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2">
          {item.title}
        </h3>

        {/* Notes Section */}
        <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-2 border border-slate-100 relative group/note">
          {isEditing ? (
            <textarea
              autoFocus
              className="w-full bg-transparent outline-none resize-none text-slate-700"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onBlur={saveNote}
              onKeyDown={(e) => {
                if(e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  saveNote();
                }
              }}
              placeholder="Size, color, or details..."
            />
          ) : (
            <div 
              onClick={() => setIsEditing(true)}
              className="cursor-pointer min-h-[1.5rem] flex items-start justify-between gap-2"
            >
              <span className={clsx(note ? "text-slate-600" : "text-slate-400 italic")}>
                {note || "Add details (size, color)..."}
              </span>
              <Pencil size={12} className="opacity-0 group-hover/note:opacity-100 transition-opacity text-slate-400 mt-0.5" />
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={toggleStatus}
          disabled={loading}
          className={twMerge(
            "mt-auto w-full py-2 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all transform active:scale-95",
            isPurchased 
              ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200" 
              : "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200"
          )}
        >
          {loading ? (
            <span className="animate-pulse">Updating...</span>
          ) : isPurchased ? (
            <>
              <Check size={16} /> Purchased
            </>
          ) : (
            <>
              <ShoppingCart size={16} /> To Buy
            </>
          )}
        </button>
      </div>
    </div>
  );
}