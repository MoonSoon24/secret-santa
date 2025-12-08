import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');

  const createEvent = async () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit code
    const { data, error } = await supabase
      .from('events')
      .insert([{ code, host_id: user.id, status: 'LOBBY' }])
      .select()
      .single();

    if (error) {
      alert("Error creating event");
    } else {
      // Auto-join the host
      await joinEventLogic(code); 
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    await joinEventLogic(joinCode);
  };

  const joinEventLogic = async (code) => {
    // 1. Find Event
    const { data: event, error: eventError } = await supabase
      .from('events').select('*').eq('code', code).single();
    
    if (!event || eventError) return alert("Invalid Code");
    if (event.status !== 'LOBBY') return alert("Event has already started!");

    // 2. Join Event
    const { error: joinError } = await supabase
      .from('participants')
      .insert([{ event_id: event.id, user_id: user.id }]);

    if (joinError && joinError.code !== '23505') { // 23505 = duplicate key (already joined)
      alert(joinError.message);
    } else {
      navigate(`/lobby/${event.id}`);
    }
  };

  return (
    <div className="container">
      <h1>Dashboard</h1>
      <div className="card">
        <h2>Create New Event</h2>
        <button onClick={createEvent}>Create Event & Get Code</button>
      </div>
      <div className="card">
        <h2>Join Event</h2>
        <form onSubmit={handleJoin}>
          <input 
            placeholder="Enter 6-digit Code" 
            value={joinCode} 
            onChange={e => setJoinCode(e.target.value)} 
          />
          <button>Join</button>
        </form>
      </div>
      <button onClick={() => supabase.auth.signOut()} style={{marginTop: '20px'}}>Sign Out</button>
    </div>
  );
}