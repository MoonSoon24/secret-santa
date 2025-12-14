import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  const [myNickname, setMyNickname] = useState('');
  const [eventData, setEventData] = useState(null);
  const [target, setTarget] = useState(null); 
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Host Management Modal
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [constraintGroup, setConstraintGroup] = useState(''); 
  const [constraintStrictPool, setConstraintStrictPool] = useState(''); 
  const [constraintExclusions, setConstraintExclusions] = useState([]); 
  const [constraintSpectator, setConstraintSpectator] = useState(false);
  
  // Host Management - Nickname Edit
  const [isEditingHostNickname, setIsEditingHostNickname] = useState(false);
  const [hostNicknameInput, setHostNicknameInput] = useState('');

  // Settings Modal
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsName, setSettingsName] = useState('');
  const [settingsBudget, setSettingsBudget] = useState('');
  const [settingsDesc, setSettingsDesc] = useState('');
  const [settingsDate, setSettingsDate] = useState('');

  // Nickname Modal (Self)
  const [showNicknameModal, setShowNicknameModal] = useState(false);

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
          setEventData(payload.new); // Update event data in real time
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
          setMyNickname(me.nickname || '');
          
          // Check Admin status (Host OR is_admin flag)
          const isHost = ev?.host_id === user.id;
          setIsAdmin(isHost || me.is_admin);

          if (ev?.status === 'LOCKED') {
              if (me.is_participating !== false) {
                  // Only navigate to reveal if they haven't revealed and are participating
                  if (!me.is_revealed) {
                      navigate(`/reveal/${eventId}`);
                  } else if (me.target_id) {
                      fetchTargetInfo(me.target_id);
                  }
              }
          }
      }
    }
  }

  async function fetchTargetInfo(targetId) {
      // Fetch target name (nickname priority)
      const { data: part } = await supabase
          .from('participants')
          .select('wishlist, nickname, user_id')
          .eq('event_id', eventId)
          .eq('user_id', targetId)
          .single();
      
      const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', targetId)
          .single();

      setTarget({
          username: part?.nickname || profile?.username || t('unknown'),
          wishlist: part?.wishlist
      });
  }

  async function updateWishlist() {
    await supabase.from('participants')
      .update({ wishlist: myWishlist })
      .eq('event_id', eventId)
      .eq('user_id', user.id);
    notify(t('wishlistUpdated'), "success");
  }

  async function updateNickname() {
    await supabase.from('participants')
      .update({ nickname: myNickname })
      .eq('event_id', eventId)
      .eq('user_id', user.id);
    notify(t('nicknameUpdated'), "success");
    setShowNicknameModal(false);
  }

  // --- SETTINGS FUNCTIONS ---
  const openSettings = () => {
    setSettingsName(eventData.name);
    setSettingsBudget(eventData.budget);
    setSettingsDesc(eventData.description || '');
    setSettingsDate(eventData.gift_exchange_date || '');
    setShowSettingsModal(true);
  }

  const saveSettings = async () => {
    // Sanitize date: send null if empty string to avoid Date parsing errors
    const cleanDate = settingsDate === '' ? null : settingsDate;

    // We use .select() to ensure we get data back. 
    // If RLS blocks the update, 'data' will be empty array even if no error thrown.
    const { data, error } = await supabase.from('events').update({
        name: settingsName,
        budget: settingsBudget,
        description: settingsDesc,
        gift_exchange_date: cleanDate
    })
    .eq('id', eventId)
    .select(); 
    
    if (error) {
        notify(error.message, "error");
    } else if (data && data.length === 0) {
        // This catches the case where request succeeds (204) but RLS filtered it out
        notify(t('updateFailed'), "error");
    } else {
        notify(t('eventSettingsUpdated'), "success");
        setShowSettingsModal(false);
    }
  }

  // --- HOST FUNCTIONS ---

  const openConstraintModal = (participant) => {
    setSelectedParticipant(participant);
    setConstraintGroup(participant.group_id || '');
    setConstraintStrictPool(participant.strict_pool_id || '');
    setConstraintExclusions(participant.exclusions || []);
    setConstraintSpectator(participant.is_participating === false);
    
    // Reset Nickname edit state for the modal
    setIsEditingHostNickname(false);
    setHostNicknameInput(participant.nickname || '');
  };

  const saveHostNickname = async () => {
      if (!selectedParticipant) return;
      const { error } = await supabase.from('participants')
        .update({ nickname: hostNicknameInput || null })
        .eq('id', selectedParticipant.id);

      if (error) notify(error.message, "error");
      else {
          notify(t('nicknameUpdated'), "success");
          // Update local selected participant to reflect change immediately in UI
          setSelectedParticipant(prev => ({ ...prev, nickname: hostNicknameInput }));
          setIsEditingHostNickname(false);
      }
  };

  const toggleExclusion = (targetUserId) => {
    if (constraintExclusions.includes(targetUserId)) {
        setConstraintExclusions(constraintExclusions.filter(id => id !== targetUserId));
    } else {
        setConstraintExclusions([...constraintExclusions, targetUserId]);
    }
  };

  const toggleCoHost = async () => {
    if (!selectedParticipant) return;
    const newVal = !selectedParticipant.is_admin;
    const { error } = await supabase.from('participants')
        .update({ is_admin: newVal })
        .eq('id', selectedParticipant.id);
    
    if (error) notify(error.message, "error");
    else notify(newVal ? t('promoted') : t('demoted'), "success");
    setSelectedParticipant({...selectedParticipant, is_admin: newVal});
  }

  const saveConstraints = async () => {
    if (!selectedParticipant) return;
    
    const { error } = await supabase.from('participants')
        .update({ 
            group_id: constraintGroup || null,
            strict_pool_id: constraintStrictPool || null,
            exclusions: constraintExclusions,
            is_participating: !constraintSpectator 
        })
        .eq('id', selectedParticipant.id);
    
    if (error) notify(error.message, "error");
    else notify(t('constraintsSaved'), "success");
    
    setSelectedParticipant(null);
  };

  const removeParticipant = () => {
    if (!selectedParticipant) return;
    confirmAction(
      t('confirmRemove', { name: selectedParticipant.nickname || selectedParticipant.profiles.username }),
      async () => {
        const { error, count } = await supabase
          .from('participants')
          .delete({ count: 'exact' })
          .eq('id', selectedParticipant.id);

        if (error) notify("Error: " + error.message, "error");
        else if (count === 0) notify(t('unableToRemove'), "error");
        else {
          notify(t('participantRemoved'), "success");
          setParticipants(prev => prev.filter(p => p.id !== selectedParticipant.id));
          setSelectedParticipant(null);
          fetchData();
        }
      }
    );
  };

  const handleStartEvent = () => {
    confirmAction(
      t('confirmStart'),
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
          notify(t('eventStarted'), "success");
        } catch (err) {
          notify(err.message, "error");
        }
      }
    );
  };

  const handleUndoSpin = () => {
    confirmAction(
      t('confirmReset'),
      async () => {
        await supabase.from('participants')
            .update({ target_id: null, is_revealed: false })
            .eq('event_id', eventId);
        
        await supabase.from('events').update({ status: 'LOBBY' }).eq('id', eventId);
        setTarget(null);
        fetchData();
        notify(t('eventReset'), "success");
      }
    );
  };

  return (
    <div className="container">
      {/* Home / Back Button */}
      <div style={{marginBottom: '20px'}}>
        <Link to="/dashboard" style={{textDecoration: 'none'}}>
            <button className="outline" style={{width: 'auto', padding: '8px 15px', fontSize: '0.9rem'}}>
                🏠 {t('dashboard')}
            </button>
        </Link>
      </div>

      <div style={{textAlign: 'center', marginBottom: '30px'}}>
        <h1>{eventData?.name || t('appName')}</h1>
        <div style={{color: 'var(--text-main)', background: 'rgba(255,255,255,0.8)', display:'inline-block', padding: '15px 25px', borderRadius: '15px', maxWidth: '600px'}}>
            <div style={{display: 'flex', flexDirection: 'column', gap: '5px'}}>
                <div style={{fontSize: '1.2em'}}>
                    {t('code')}: <strong style={{color: 'var(--primary)', letterSpacing: '1px'}}>{eventData?.code}</strong>
                </div>
                
                {eventData?.description && (
                    <div style={{fontSize: '1rem', fontStyle: 'italic', color: '#555', margin: '5px 0', borderTop: '1px solid #ddd', borderBottom: '1px solid #ddd', padding: '5px 0'}}>
                        "{eventData.description}"
                    </div>
                )}

                <div style={{display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', fontSize: '0.9rem', color: '#444'}}>
                    <div>
                        💰 <strong>{t('budget')}:</strong> {eventData?.budget || t('noLimit')}
                    </div>
                    <div>
                        📅 <strong>{t('date')}:</strong> {eventData?.gift_exchange_date || t('tbd')}
                    </div>
                </div>
            </div>
        </div>
        
        <div style={{marginTop: '10px'}}>
            {/* Removed standalone edit profile button since it's now on the card */}
            {isAdmin && (
                <button className="outline" onClick={openSettings} style={{fontSize: '0.9rem', padding: '5px 15px', marginLeft: '10px'}}>
                   ⚙️ {t('lobbySettings')}
                </button>
            )}
        </div>
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
            {participants.map(p => {
                const username = p.profiles?.username || t('unknown');
                const displayName = p.nickname ? (
                    <span>{p.nickname} <small style={{color: '#666', fontWeight: 'normal'}}>({username})</small></span>
                ) : (
                    <span>{username}</span>
                );
                
                const isHost = p.user_id === eventData?.host_id;
                const isCoHost = p.is_admin && !isHost;
                const isSpectator = p.is_participating === false;
                
                // Show gear icon if user is admin OR if it's the user's own card
                const showGear = (isAdmin && eventData?.status === 'LOBBY') || (p.user_id === user.id);

                return (
                  <li key={p.id}>
                    <div>
                        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                            <span style={{fontWeight: 'bold'}}>
                                {displayName}
                            </span>
                            {/* Checkmark for revealed */}
                            {p.is_revealed && <span title="Already saw their target">✅</span>}
                        </div>
                        
                        <div style={{fontSize: '0.75rem', marginTop: '4px', display: 'flex', gap: '5px', flexWrap: 'wrap'}}>
                            {isHost && <span title={t('hostTag')} style={{background: '#FFD700', padding: '2px 6px', borderRadius: '4px', cursor: 'help'}}>👑 {t('hostTag')}</span>}
                            {isCoHost && <span title={t('coHostTag')} style={{background: '#ADD8E6', padding: '2px 6px', borderRadius: '4px', cursor: 'help'}}>🛡️ {t('coHostTag')}</span>}
                            {isSpectator && <span title={t('spectatorTag')} style={{background: '#e0e0e0', color: '#666', padding: '2px 6px', borderRadius: '4px', cursor: 'help'}}>👁️ {t('spectatorTag')}</span>}
                            {p.group_id && <span title={t('exclusionGroup')} style={{background: '#ffcdd2', padding: '2px 6px', borderRadius: '4px', cursor: 'help'}}>🚫 G: {p.group_id}</span>}
                            {p.strict_pool_id && <span title={t('strictPool')} style={{background: '#c8e6c9', padding: '2px 6px', borderRadius: '4px', cursor: 'help'}}>🔒 Pool: {p.strict_pool_id}</span>}
                        </div>
                    </div>
                    
                    {/* Gear Icon Logic */}
                    {showGear && (
                        <button className="icon-btn" onClick={() => openConstraintModal(p)}>⚙️</button>
                    )}
                  </li>
                )
            })}
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
      {isAdmin && (
        <div style={{marginTop: '30px', textAlign: 'center'}}>
          {eventData?.status === 'LOBBY' ? (
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
            <div style={{display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center'}}>
                {/* Kiosk Mode Button */}
                <Link to={`/reveal/${eventId}?kiosk=true`}>
                    <button className="primary-action" style={{background: '#2C3E50', width: 'auto'}}>
                        🖥️ {t('kioskMode')}
                    </button>
                </Link>

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
            </div>
          )}
        </div>
      )}

      {/* Constraints Modal */}
      {selectedParticipant && (
        <div className="modal-overlay" onClick={() => setSelectedParticipant(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxHeight: '90vh', overflowY: 'auto'}}>
            <button className="close-btn" onClick={() => setSelectedParticipant(null)}>×</button>
            
            {/* Modal Header with Nickname Edit */}
            <div style={{marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px'}}>
                {!isEditingHostNickname ? (
                    <h3 style={{marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px'}}>
                        {t('manage')}: {selectedParticipant.nickname || selectedParticipant.profiles.username}
                        {/* Allowed to edit nickname if Admin OR Self */}
                        {(isAdmin || selectedParticipant.user_id === user.id) && (
                            <button 
                                className="icon-btn" 
                                style={{margin: 0, fontSize: '0.8rem', padding: '2px 8px'}}
                                onClick={() => setIsEditingHostNickname(true)}
                            >
                                ✏️
                            </button>
                        )}
                    </h3>
                ) : (
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                         <input 
                            value={hostNicknameInput}
                            onChange={(e) => setHostNicknameInput(e.target.value)}
                            placeholder={t('nickname')}
                            style={{margin: 0}}
                         />
                         <button onClick={saveHostNickname} style={{width: 'auto', padding: '8px 15px'}}>💾</button>
                         <button onClick={() => setIsEditingHostNickname(false)} style={{width: 'auto', padding: '8px 15px', background: '#ccc'}}>❌</button>
                    </div>
                )}
            </div>
            
            {/* --- ADMIN ONLY SECTIONS --- */}
            {isAdmin && (
                <>
                    {/* Co-Host Promotion */}
                    {eventData?.host_id === user.id && selectedParticipant.user_id !== user.id && (
                        <div style={{marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #eee'}}>
                            <button onClick={toggleCoHost} className="outline" style={{width: '100%'}}>
                                {selectedParticipant.is_admin ? `⬇️ ${t('demoteToMember')}` : `⬆️ ${t('promoteToCoHost')}`}
                            </button>
                        </div>
                    )}

                    {/* Spectator Toggle */}
                    <div style={{marginBottom: '20px'}}>
                        <label style={{display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: '#f5f5f5', padding: '10px', borderRadius: '8px'}}>
                            <input 
                                type="checkbox" 
                                checked={constraintSpectator} 
                                onChange={e => setConstraintSpectator(e.target.checked)}
                                style={{width: 'auto', margin: 0}}
                            />
                            <div>
                                <strong>{t('spectatorMode')}</strong>
                                <div style={{fontSize: '0.8em', color: '#666'}}>{t('spectatorModeHelp')}</div>
                            </div>
                        </label>
                    </div>

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
                                        {p.nickname || p.profiles.username}
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
                </>
            )}
            
            {/* If not admin and viewing self, show message or nothing else */}
            {!isAdmin && selectedParticipant.user_id === user.id && (
                <p style={{fontSize: '0.9em', color: '#666', fontStyle: 'italic'}}>
                    {t('hostManageSelfWarning')}
                </p>
            )}

          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
          <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={() => setShowSettingsModal(false)}>×</button>
                <h3 style={{marginTop: 0}}>{t('updateSettings')}</h3>
                
                <label><strong>{t('lobbyNameLabel')}</strong></label>
                <input value={settingsName} onChange={e => setSettingsName(e.target.value)} />

                <label><strong>{t('budget')}</strong></label>
                <input value={settingsBudget} onChange={e => setSettingsBudget(e.target.value)} />

                <label><strong>{t('description')}</strong></label>
                <textarea rows="3" value={settingsDesc} onChange={e => setSettingsDesc(e.target.value)} />

                <label><strong>{t('date')}</strong></label>
                <input type="date" value={settingsDate} onChange={e => setSettingsDate(e.target.value)} />

                <button onClick={saveSettings}>{t('saveLobby')}</button>
            </div>
          </div>
      )}
    </div>
  );
}