import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import { drawNames } from '../utils/matcher';

export default function Lobby() {
  const { eventId } = useParams();
  const { user } = useAuth();
  const { notify, confirmAction } = useNotification();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState([]);
  const [myWishlist, setMyWishlist] = useState('');
  const [eventData, setEventData] = useState(null);
  const [target, setTarget] = useState(null); 
  
  // Host Management Modal
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [constraintGroup, setConstraintGroup] = useState(''); 
  const [constraintStrictPool, setConstraintStrictPool] = useState(''); 
  const [constraintExclusions, setConstraintExclusions] = useState([]); 

  useEffect(() => {
    fetchData();

    const channel = supabase.channel('room')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'participants', filter: `event_id=eq.${eventId}` }, 
        () => fetchData()
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'events', filter: `id=eq.${eventId}` }, 
        (payload) => {
          if (payload.new.status === 'LOCKED') fetchData();
          if (payload.new.status === 'LOBBY') fetchData();
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  async function fetchData() {
    const { data: ev, error: evError } = await supabase.from('events').select('*').eq('id', eventId).single();
    if (evError) console.error(evError);
    setEventData(ev);

    // Clear target if event was reset to lobby
    if (ev?.status === 'LOBBY') {
        setTarget(null);
    }

    const { data: parts, error: partError } = await supabase
      .from('participants')
      .select('*')
      .eq('event_id', eventId);
    
    if (partError) console.error(partError);

    const safeParts = parts || [];
    let combinedParticipants = [];

    if (safeParts.length > 0) {
      const userIds = safeParts.map(p => p.user_id);
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds);
      
      combinedParticipants = safeParts.map(p => {
        const profile = profiles?.find(prof => prof.id === p.user_id);
        return {
          ...p,
          profiles: profile || { username: t('unknown') }
        };
      });
    }

    setParticipants(combinedParticipants);
    
    if (user) {
      const me = combinedParticipants.find(p => p.user_id === user.id);
      if (me) {
          setMyWishlist(me.wishlist || '');
          if (ev?.status === 'LOCKED') {
              if (!me.is_revealed) {
                  navigate(`/reveal/${eventId}`);
              } else if (me.target_id) {
                  fetchTargetInfo(me.target_id);
              }
          }
      }
    }
  }

  async function fetchTargetInfo(targetId) {
      const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', targetId)
          .single();

      const { data: part } = await supabase
          .from('participants')
          .select('wishlist')
          .eq('event_id', eventId)
          .eq('user_id', targetId)
          .single();
      
      setTarget({
          username: profile?.username || t('unknown'),
          wishlist: part?.wishlist
      });
  }

  async function updateWishlist() {
    await supabase.from('participants')
      .update({ wishlist: myWishlist })
      .eq('event_id', eventId)
      .eq('user_id', user.id);
    notify("Wishlist updated!", "success");
  }

  // --- HOST FUNCTIONS ---

  const openConstraintModal = (participant) => {
    setSelectedParticipant(participant);
    setConstraintGroup(participant.group_id || '');
    setConstraintStrictPool(participant.strict_pool_id || '');
    setConstraintExclusions(participant.exclusions || []);
  };

  const toggleExclusion = (targetUserId) => {
    if (constraintExclusions.includes(targetUserId)) {
        setConstraintExclusions(constraintExclusions.filter(id => id !== targetUserId));
    } else {
        setConstraintExclusions([...constraintExclusions, targetUserId]);
    }
  };

  const saveConstraints = async () => {
    if (!selectedParticipant) return;
    
    const { error } = await supabase.from('participants')
        .update({ 
            group_id: constraintGroup || null,
            strict_pool_id: constraintStrictPool || null,
            exclusions: constraintExclusions 
        })
        .eq('id', selectedParticipant.id);
    
    if (error) notify(error.message, "error");
    else notify("Constraints saved!", "success");
    
    setSelectedParticipant(null);
  };

  const removeParticipant = () => {
    if (!selectedParticipant) return;
    
    confirmAction(
      `Are you sure you want to remove ${selectedParticipant.profiles.username}?`,
      async () => {
        // Request count: 'exact' to ensure we know if a row was actually deleted
        const { error, count } = await supabase
          .from('participants')
          .delete({ count: 'exact' })
          .eq('id', selectedParticipant.id);

        if (error) {
          notify("Error removing participant: " + error.message, "error");
        } else if (count === 0) {
          // If count is 0, the delete failed (e.g. permission denied or ID mismatch)
          // Do NOT update local state in this case
          notify("Unable to remove participant. Please check permissions.", "error");
        } else {
          notify("Participant removed.", "success");
          
          // Only perform optimistic update if the DB confirmed deletion
          setParticipants(prev => prev.filter(p => p.id !== selectedParticipant.id));
          
          setSelectedParticipant(null);
          fetchData();
        }
      }
    );
  };

  const handleStartEvent = () => {
    confirmAction(
      "This will lock the room and draw names. It cannot be undone!",
      async () => {
        try {
          const updates = drawNames(participants);
          for (let update of updates) {
             await supabase.from('participants')
               .update({ target_id: update.target_id })
               .eq('id', update.row_id);
          }
          await supabase.from('events').update({ status: 'LOCKED' }).eq('id', eventId);
          fetchData();
          notify("Event Started! Good luck!", "success");
        } catch (err) {
          notify(err.message, "error");
        }
      }
    );
  };

  const handleUndoSpin = () => {
    confirmAction(
      "Are you sure? This will RESET all matches and send everyone back to the lobby.",
      async () => {
        // Reset participants
        await supabase.from('participants')
            .update({ target_id: null, is_revealed: false })
            .eq('event_id', eventId);
        
        // Unlock event
        await supabase.from('events')
            .update({ status: 'LOBBY' })
            .eq('id', eventId);
        
        setTarget(null);
        fetchData();
        notify("Event reset! Constraints can be modified now.", "success");
      }
    );
  };

  return (
    <div className="container">
      <div style={{textAlign: 'center', marginBottom: '30px'}}>
        <h1>{eventData?.name || "Secret Santa"}</h1>
        <p style={{color: 'var(--text-main)', background: 'rgba(255,255,255,0.8)', display:'inline-block', padding: '5px 15px', borderRadius: '15px'}}>
            {t('code')}: <strong style={{color: 'var(--primary)'}}>{eventData?.code}</strong> 
            {eventData?.budget && ` • ${t('budget')}: Rp.${eventData.budget}`}
        </p>
      </div>

      {/* --- SHOW TARGET IF REVEALED --- */}
      {target && (
        <div className="card fade-in" style={{border: '4px solid var(--gold)', background: '#fffbeb', textAlign: 'center'}}>
            <h2 style={{color: '#888', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '2px', marginTop: '0'}}>🎁 {t('giftingTo')}:</h2>
            <h1 style={{color: 'var(--primary)', margin: '10px 0', fontSize: '2.5rem'}}>{target.username}</h1>
            <div style={{textAlign: 'left', marginTop: '20px', background: 'rgba(0,0,0,0.03)', padding: '15px', borderRadius: '8px'}}>
                <strong>{t('theirWishlist')}:</strong>
                <p style={{fontStyle: 'italic', margin: '5px 0', whiteSpace: 'pre-wrap'}}>
                    {target.wishlist || t('noWishlist')}
                </p>
            </div>
        </div>
      )}
      
      <div className="grid-2 fade-in">
        <div className="card">
          <h3>👥 {t('participants')} ({participants.length})</h3>
          <ul>
            {participants.map(p => (
              <li key={p.id}>
                <div>
                    <span style={{fontWeight: 'bold', display: 'block'}}>{p.profiles?.username || t('unknown')}</span>
                    <div style={{fontSize: '0.75rem', marginTop: '4px', display: 'flex', gap: '5px', flexWrap: 'wrap'}}>
                        {p.user_id === eventData?.host_id && <span style={{background: '#FFD700', padding: '2px 6px', borderRadius: '4px'}}>👑 {t('hostTag')}</span>}
                        {p.group_id && <span style={{background: '#ffcdd2', padding: '2px 6px', borderRadius: '4px'}}>🚫 G: {p.group_id}</span>}
                        {p.strict_pool_id && <span style={{background: '#c8e6c9', padding: '2px 6px', borderRadius: '4px'}}>🔒 Pool: {p.strict_pool_id}</span>}
                        {p.exclusions && p.exclusions.length > 0 && <span style={{background: '#eee', padding: '2px 6px', borderRadius: '4px'}}>⛔ {p.exclusions.length} Exclusions</span>}
                    </div>
                </div>
                
                {/* Host Controls - Hidden if Locked */}
                {eventData?.host_id === user?.id && eventData?.status === 'LOBBY' && (
                    <button className="icon-btn" onClick={() => openConstraintModal(p)}>⚙️</button>
                )}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="card">
          <h3>📝 {t('yourWishlistTitle')}</h3>
          <p style={{fontSize: '0.9em', color: '#666'}}>{t('wishlistHelp')}</p>
          <textarea 
            rows="5"
            value={myWishlist} 
            onChange={e => setMyWishlist(e.target.value)}
            placeholder={t('wishlistPlaceholder')}
          />
          <button onClick={updateWishlist}>{t('saveWishlist')}</button>
        </div>
      </div>

      {/* Start / Undo Section */}
      {eventData?.host_id === user?.id && (
        <div style={{marginTop: '30px', textAlign: 'center'}}>
          {eventData.status === 'LOBBY' ? (
             !target && (
              <>
                <button 
                  className="primary-action"
                  onClick={handleStartEvent} 
                  style={{ padding: '15px 40px', fontSize: '1.2rem' }}
                >
                  🚀 {t('startEvent')}
                </button>
                <p style={{color: 'rgba(255,255,255,0.7)', marginTop: '10px'}}>{t('startEventHelp')}</p>
              </>
             )
          ) : (
            <button 
                onClick={handleUndoSpin} 
                style={{
                  background: 'rgba(0,0,0,0.5)', 
                  fontSize: '1rem', 
                  width: 'auto', 
                  border: '1px solid rgba(255,255,255,0.3)', 
                  color: 'white'
                }}
            >
                🔄 {t('resetEvent')}
            </button>
          )}
        </div>
      )}

      {/* Constraints Modal */}
      {selectedParticipant && (
        <div className="modal-overlay" onClick={() => setSelectedParticipant(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxHeight: '90vh', overflowY: 'auto'}}>
            <button className="close-btn" onClick={() => setSelectedParticipant(null)}>×</button>
            <h3 style={{marginTop: 0}}>{t('manage')}: {selectedParticipant.profiles.username}</h3>
            
            <div style={{marginBottom: '20px'}}>
                <label style={{display:'block', marginBottom: '5px'}}><strong>🚫 {t('exclusionGroup')}</strong></label>
                <p style={{fontSize: '0.8em', color: '#666', marginTop: 0}}>{t('exclusionGroupHelp')}</p>
                <input 
                    value={constraintGroup} 
                    onChange={e => setConstraintGroup(e.target.value)}
                    placeholder="e.g. GroupA" 
                />
            </div>

            <div style={{marginBottom: '20px'}}>
                <label style={{display:'block', marginBottom: '5px'}}><strong>🔒 {t('strictPool')}</strong></label>
                <p style={{fontSize: '0.8em', color: '#666', marginTop: 0}}>{t('strictPoolHelp')}</p>
                <input 
                    value={constraintStrictPool} 
                    onChange={e => setConstraintStrictPool(e.target.value)}
                    placeholder="e.g. KidsTable" 
                />
            </div>

            <div style={{marginBottom: '20px'}}>
                <label style={{display:'block', marginBottom: '5px'}}><strong>⛔ {t('specificExclusions')}</strong></label>
                <p style={{fontSize: '0.8em', color: '#666', marginTop: 0}}>{t('specificExclusionsHelp')}</p>
                <div style={{maxHeight: '150px', overflowY: 'auto', border: '1px solid #eee', padding: '10px', borderRadius: '8px'}}>
                    {participants
                        .filter(p => p.user_id !== selectedParticipant.user_id)
                        .map(p => (
                            <label key={p.id} style={{display: 'flex', alignItems: 'center', gap: '10px', padding: '5px 0', cursor: 'pointer'}}>
                                <input 
                                    type="checkbox" 
                                    checked={constraintExclusions.includes(p.user_id)}
                                    onChange={() => toggleExclusion(p.user_id)}
                                    style={{width: 'auto', margin: 0}}
                                />
                                {p.profiles.username}
                            </label>
                        ))
                    }
                </div>
            </div>

            <button onClick={saveConstraints} style={{marginBottom: '20px'}}>{t('saveConstraints')}</button>

             {/* Danger Zone */}
             <div style={{borderTop: '1px solid #eee', paddingTop: '20px'}}>
                <button 
                  onClick={removeParticipant} 
                  style={{backgroundColor: '#e63946', color: 'white'}}
                >
                  ⚠️ {t('removeParticipant')}
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}