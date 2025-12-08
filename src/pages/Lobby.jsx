import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { drawNames } from '../utils/matcher';

export default function Lobby() {
  const { eventId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState([]);
  const [myWishlist, setMyWishlist] = useState('');
  const [eventData, setEventData] = useState(null);

  // 1. Initial Fetch
  useEffect(() => {
    fetchData();

    // 2. Realtime Listener
    const channel = supabase.channel('room')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'participants', filter: `event_id=eq.${eventId}` }, 
        () => fetchData() // Refresh list on any change
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'events', filter: `id=eq.${eventId}` }, 
        (payload) => {
          if (payload.new.status === 'LOCKED') navigate(`/reveal/${eventId}`);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  async function fetchData() {
    // Get Event Info
    const { data: ev } = await supabase.from('events').select('*').eq('id', eventId).single();
    setEventData(ev);
    if(ev?.status === 'LOCKED') navigate(`/reveal/${eventId}`);

    // Get Participants
    const { data: parts } = await supabase
      .from('participants')
      .select('*, profiles(username)')
      .eq('event_id', eventId);
    
    setParticipants(parts);
    
    // Set my existing wishlist
    const me = parts.find(p => p.user_id === user.id);
    if (me) setMyWishlist(me.wishlist || '');
  }

  async function updateWishlist() {
    await supabase.from('participants')
      .update({ wishlist: myWishlist })
      .eq('event_id', eventId)
      .eq('user_id', user.id);
    alert("Wishlist updated!");
  }

  async function handleStartEvent() {
    if (!confirm("This will lock the room and draw names. Cannot be undone!")) return;

    try {
      // 1. Run Algorithm
      const updates = drawNames(participants);

      // 2. Save matches to DB
      for (let update of updates) {
         await supabase.from('participants')
           .update({ target_id: update.target_id })
           .eq('id', update.row_id);
      }

      // 3. Lock Event
      await supabase.from('events').update({ status: 'LOCKED' }).eq('id', eventId);
      
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="container">
      <h1>Lobby Code: {eventData?.code}</h1>
      <div style={{ display: 'flex', gap: '20px' }}>
        <div className="card" style={{ flex: 1 }}>
          <h3>Participants ({participants.length})</h3>
          <ul>
            {participants.map(p => (
              <li key={p.id}>{p.profiles.username}</li>
            ))}
          </ul>
        </div>
        
        <div className="card" style={{ flex: 1 }}>
          <h3>Your Wishlist</h3>
          <textarea 
            value={myWishlist} 
            onChange={e => setMyWishlist(e.target.value)}
            placeholder="I want a red mug..."
          />
          <button onClick={updateWishlist}>Save Wishlist</button>
        </div>
      </div>

      {eventData?.host_id === user.id && (
        <button 
          onClick={handleStartEvent} 
          style={{ marginTop: '20px', backgroundColor: '#e63946', color: 'white' }}
        >
          START EVENT (HOST ONLY)
        </button>
      )}
    </div>
  );
}