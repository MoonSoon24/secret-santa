import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');
  const [myEvents, setMyEvents] = useState([]);
  
  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [newEventBudget, setNewEventBudget] = useState('');

  useEffect(() => {
    if (user) fetchMyEvents();
  }, [user]);

  const fetchMyEvents = async () => {
    // Fetch events where the current user is a participant
    const { data: participations, error } = await supabase
      .from('participants')
      .select('event_id, events(*)')
      .eq('user_id', user.id);

    if (error) console.error(error);
    else {
      // Flatten the structure
      const events = participations.map(p => p.events).filter(Boolean);
      setMyEvents(events);
    }
  };

  const createEvent = async (e) => {
    e.preventDefault();
    if (!newEventName) return notify("Please enter a name", "error");

    const code = Math.floor(100000 + Math.random() * 900000).toString(); 
    
    const { data, error } = await supabase
      .from('events')
      .insert([{ 
        code, 
        host_id: user.id, 
        status: 'LOBBY',
        name: newEventName,
        budget: newEventBudget || 'No Limit'
      }])
      .select()
      .single();

    if (error) {
      notify("Error creating event: " + error.message, "error");
    } else {
      await joinEventLogic(code); 
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    await joinEventLogic(joinCode);
  };

  const joinEventLogic = async (code) => {
    const { data: event, error: eventError } = await supabase
      .from('events').select('*').eq('code', code).single();
    
    if (!event || eventError) return notify("Invalid Code", "error");
    
    // Check if already joined
    const { data: existing } = await supabase
        .from('participants')
        .select('*')
        .eq('event_id', event.id)
        .eq('user_id', user.id)
        .single();
        
    if (existing) {
        navigate(`/lobby/${event.id}`);
        return;
    }

    if (event.status !== 'LOBBY') return notify("Event has already started!", "error");

    const { error: joinError } = await supabase
      .from('participants')
      .insert([{ event_id: event.id, user_id: user.id }]);

    if (joinError) { 
      notify(joinError.message, "error");
    } else {
      navigate(`/lobby/${event.id}`);
    }
  };

  return (
    <div className="container">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
        <h1>Dashboard</h1>
        <button className="outline" onClick={() => supabase.auth.signOut()} style={{width: 'auto'}}>
          Sign Out
        </button>
      </div>

      <div className="dashboard-grid fade-in">
        
        {/* Create Event Card */}
        <div className="card" style={{display: 'flex', flexDirection: 'column', justifyContent: 'space-between', margin: 0}}>
          <div>
            <h2>🎅 Host an Event</h2>
            <p>Create a new Secret Santa room, set a budget, and invite friends.</p>
          </div>
          <button className="primary-action" onClick={() => setShowCreateModal(true)} style={{marginTop: '20px'}}>
            Create New Group
          </button>
        </div>

        {/* Separator */}
        <div className="or-divider">OR</div>

        {/* Join Event Card */}
        <div className="card" style={{margin: 0}}>
          <h2>☃️ Join an Event</h2>
          <p>Enter the 6-digit code provided by your group host.</p>
          <form onSubmit={handleJoin} style={{marginTop: '20px', display: 'flex', gap: '10px'}}>
            <input 
              placeholder="123456" 
              value={joinCode} 
              onChange={e => setJoinCode(e.target.value)} 
              style={{fontSize: '1.2rem', letterSpacing: '2px', textAlign: 'center', margin: 0}}
            />
            <button style={{width: 'auto'}}>Join</button>
          </form>
        </div>
      </div>

      {/* My Events List */}
      <div className="card fade-in" style={{marginTop: '30px'}}>
        <h3>📅 Your Events</h3>
        {myEvents.length === 0 ? (
          <p style={{color: '#999', fontStyle: 'italic'}}>You haven't joined any events yet.</p>
        ) : (
          <ul>
            {myEvents.map(ev => (
              <li key={ev.id}>
                <div>
                    <strong>{ev.name || "Secret Santa Event"}</strong>
                    <span style={{fontSize: '0.8em', color: '#666', marginLeft: '10px'}}>
                        (Code: {ev.code})
                    </span>
                </div>
                {/* Always link to Lobby, let Lobby decide logic */}
                <Link to={`/lobby/${ev.id}`}>
                    <button className="icon-btn">
                        {ev.status === 'LOCKED' ? '🎁 View Gift' : '👉 Enter Lobby'}
                    </button>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowCreateModal(false)}>×</button>
            <h2 style={{textAlign: 'center', marginBottom: '20px'}}>Create New Lobby</h2>
            <form onSubmit={createEvent}>
              <label><strong>Lobby Name</strong></label>
              <input 
                placeholder="e.g. Office Party 2024" 
                value={newEventName}
                onChange={e => setNewEventName(e.target.value)}
                autoFocus
              />
              
              <label><strong>Budget (Optional)</strong></label>
              <input 
                placeholder="e.g. 100k - 250k" 
                value={newEventBudget}
                onChange={e => setNewEventBudget(e.target.value)}
              />

              <button className="primary-action" style={{marginTop: '10px'}}>Create & Join</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}