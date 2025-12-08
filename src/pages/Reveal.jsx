import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function Reveal() {
  const { eventId } = useParams();
  const { user } = useAuth();
  const [target, setTarget] = useState(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    async function getMatch() {
      // 1. Get my row to find out who my target_id is
      const { data: myRow } = await supabase
        .from('participants')
        .select('target_id')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .single();

      if (myRow?.target_id) {
        // 2. Fetch the Target's profile and wishlist
        const { data: targetData } = await supabase
          .from('participants')
          .select('wishlist, profiles(username)')
          .eq('event_id', eventId)
          .eq('user_id', myRow.target_id)
          .single();
        
        setTarget(targetData);
      }
    }
    getMatch();
  }, []);

  if (!target) return <div>Loading secret info...</div>;

  return (
    <div className="container" style={{ textAlign: 'center' }}>
      <h1>Your Secret Santa Target</h1>
      
      {!revealed ? (
        <button 
          onClick={() => setRevealed(true)}
          style={{ padding: '20px 40px', fontSize: '20px', cursor: 'pointer' }}
        >
          🎁 CLICK TO REVEAL 🎁
        </button>
      ) : (
        <div className="card fade-in">
          <h2>You are gifting to:</h2>
          <h1 style={{ color: '#e63946' }}>{target.profiles.username}</h1>
          <hr />
          <h3>Their Wishlist:</h3>
          <p style={{ fontSize: '18px', whiteSpace: 'pre-wrap' }}>
            {target.wishlist || "They didn't ask for anything specific!"}
          </p>
        </div>
      )}
    </div>
  );
}