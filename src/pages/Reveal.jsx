import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';

export default function Reveal() {
  const { eventId } = useParams();
  const { user } = useAuth();
  const { notify, confirmAction } = useNotification();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isKioskMode = searchParams.get('kiosk') === 'true';
  
  const [target, setTarget] = useState(null);
  const [wheelNames, setWheelNames] = useState([]); 
  const [revealed, setRevealed] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Anti-Peek State
  const [isBlurry, setIsBlurry] = useState(true);

  // Kiosk State
  const [kioskQueue, setKioskQueue] = useState([]);
  const [kioskCurrentUser, setKioskCurrentUser] = useState(null);
  const [kioskStep, setKioskStep] = useState(0); // 0: Pass to, 1: Confirm, 2: Reveal, 3: Done
  const [isFinished, setIsFinished] = useState(false);

  const wheelRef = useRef(null);
  const SEGMENT_COLORS = ['#D42426', '#165B33', '#F8B229', '#2C3E50', '#8E44AD', '#E67E22', '#1ABC9C', '#2980B9'];

  useEffect(() => {
    initData();
  }, []);

  async function initData() {
    const { data: event } = await supabase.from('events').select('host_id').eq('id', eventId).single();
    
    // Determine admin status
    let isUserAdmin = event?.host_id === user.id;
    if (!isUserAdmin) {
        const { data: myRow } = await supabase.from('participants').select('is_admin').eq('event_id', eventId).eq('user_id', user.id).single();
        if (myRow?.is_admin) isUserAdmin = true;
    }
    setIsAdmin(isUserAdmin);

    // Kiosk Mode Logic
    if (isKioskMode) {
        if (!isUserAdmin) {
            notify("Only admins can use Kiosk Mode", "error");
            navigate(`/lobby/${eventId}`);
            return;
        }
        await loadKioskQueue();
    } else {
        // Standard User Flow
        await loadUserTarget();
    }
  }

  // --- STANDARD MODE LOGIC ---
  const loadUserTarget = async () => {
    const { data: myRow } = await supabase
        .from('participants')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .single();

    if (myRow) {
          if (myRow.is_revealed) {
              navigate(`/lobby/${eventId}`);
              return;
          }

          if (myRow.target_id) {
            const { data: targetParticipant } = await supabase
              .from('participants')
              .select('wishlist, nickname')
              .eq('event_id', eventId)
              .eq('user_id', myRow.target_id)
              .single();
            
            const { data: targetProfile } = await supabase
                .from('profiles')
                .select('username, id')
                .eq('id', myRow.target_id)
                .single();
            
            const displayName = targetParticipant?.nickname || targetProfile?.username || t('unknown');

            setTarget({
                id: targetProfile?.id,
                name: displayName,
                wishlist: targetParticipant?.wishlist,
                profiles: targetProfile || { username: t('unknown') }
            });
          }
    }
    await loadWheel();
  };

  const loadWheel = async () => {
      const { data: allParts } = await supabase
        .from('participants')
        .select('user_id, nickname')
        .eq('event_id', eventId)
        .neq('is_participating', false); // Only show participating on wheel
      
      if (allParts && allParts.length > 0) {
        const ids = allParts.map(p => p.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', ids);
        
        const names = allParts.map(p => {
            const prof = profiles.find(pr => pr.id === p.user_id);
            return { id: p.user_id, name: p.nickname || prof?.username || t('unknown') };
        });
        names.sort(() => Math.random() - 0.5);
        setWheelNames(names);
      }
  };

  const handleSpin = () => {
    if (!target || wheelNames.length === 0) return;
    setIsSpinning(true);

    const winnerIndex = wheelNames.findIndex(p => p.id === target.id);
    // If winner not on wheel (e.g. error), default to 0
    const safeIndex = winnerIndex === -1 ? 0 : winnerIndex;

    const segmentCount = wheelNames.length;
    const segmentAngle = 360 / segmentCount;
    const winnerCenterAngle = (safeIndex * segmentAngle) + (segmentAngle / 2);
    
    const extraSpins = 360 * 8; 
    const totalRotation = extraSpins - winnerCenterAngle;

    if (wheelRef.current) {
        wheelRef.current.style.transition = 'transform 5s cubic-bezier(0.15, 0, 0.2, 1)';
        wheelRef.current.style.transform = `rotate(${totalRotation}deg)`;
    }

    setTimeout(async () => {
        await supabase.from('participants')
            .update({ is_revealed: true })
            .eq('event_id', eventId)
            .eq('user_id', user.id);
        
        setRevealed(true);
    }, 5500);
  };

  // --- KIOSK MODE LOGIC ---
  const loadKioskQueue = async () => {
      // 1. Fetch participants (Manual join to be safe)
      const { data: parts, error } = await supabase
          .from('participants')
          .select('*')
          .eq('event_id', eventId)
          .neq('is_participating', false) // Use neq false to handle null as true effectively or ensure migration set true
          .order('id');
      
      if (error) {
          console.error("Error loading kiosk queue:", error);
          notify("Error loading queue", "error");
          return;
      }

      // 2. Fetch profiles
      const userIds = parts.map(p => p.user_id);
      const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', userIds);

      // 3. Merge and filter unrevealed
      const queue = parts
        .map(p => {
            const profile = profiles?.find(prof => prof.id === p.user_id);
            return {
                ...p,
                displayName: p.nickname || profile?.username || t('unknown')
            };
        })
        .filter(p => !p.is_revealed);
      
      if (queue.length === 0) {
          setIsFinished(true);
      } else {
          setKioskQueue(queue);
          setKioskCurrentUser(queue[0]);
          setKioskStep(0); // Start Step
          
          // Pre-fetch target for current kiosk user
          fetchKioskTarget(queue[0]);
      }
  };

  const fetchKioskTarget = async (currentUser) => {
      if (!currentUser.target_id) {
          // Should not happen if matches exist
          notify("User has no target!", "error");
          return;
      }

      const { data: targetPart } = await supabase
          .from('participants')
          .select('nickname, wishlist, user_id')
          .eq('event_id', eventId)
          .eq('user_id', currentUser.target_id)
          .single();
      
      const { data: targetProfile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', currentUser.target_id)
          .single();
      
      const displayName = targetPart?.nickname || targetProfile?.username || t('unknown');
      
      setTarget({
          name: displayName,
          wishlist: targetPart?.wishlist
      });
  };

  const nextKioskStep = async () => {
      if (kioskStep === 0) {
          // "Pass to X", clicked "I am X"
          setKioskStep(1); // Ready to reveal
      } else if (kioskStep === 1) {
          // Reveal clicked
          setKioskStep(2); // Shown
      } else if (kioskStep === 2) {
          // "Got it" clicked
          // Mark as revealed in DB
          await supabase.from('participants')
              .update({ is_revealed: true })
              .eq('id', kioskCurrentUser.id);
          
          // Move to next person
          await loadKioskQueue();
          setIsBlurry(true); // Reset blur
      }
  };


  const handleResetEvent = () => {
    confirmAction(
      "Are you sure? This will RESET all matches and send everyone back to the lobby.",
      async () => {
        await supabase.from('participants').update({ target_id: null, is_revealed: false }).eq('event_id', eventId);
        await supabase.from('events').update({ status: 'LOBBY' }).eq('id', eventId);
        window.location.href = `/lobby/${eventId}`;
      }
    );
  };

  if (!target && !isKioskMode) return <div className="container" style={{color: 'white', textAlign: 'center'}}>{t('loadingSecret')}</div>;
  
  if (isFinished && isKioskMode) return (
      <div className="container" style={{textAlign: 'center', color: 'white'}}>
          <h1>🎉 {t('allRevealed')}</h1>
          <Link to={`/lobby/${eventId}`}>
            <button className="outline" style={{borderColor: '#fff', color: '#fff'}}>{t('backToLobby')}</button>
          </Link>
      </div>
  );

  // Wheel Gradient
  const gradientString = wheelNames.map((_, i) => {
    const start = (i / wheelNames.length) * 100;
    const end = ((i + 1) / wheelNames.length) * 100;
    const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
    return `${color} ${start}% ${end}%`;
  }).join(', ');

  return (
    <div className="container" style={{ textAlign: 'center', minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      
      {/* --- KIOSK MODE RENDER --- */}
      {isKioskMode ? (
          <div className="kiosk-card fade-in">
              {kioskStep === 0 && (
                  <div className="card">
                      <h2>📱 {t('kioskPassTo')}</h2>
                      <div className="kiosk-avatar">🎅</div>
                      <h1>{kioskCurrentUser?.displayName}</h1>
                      <button className="primary-action" onClick={nextKioskStep} style={{fontSize: '1.2rem', padding: '15px 40px'}}>
                          {t('iAm')} {kioskCurrentUser?.displayName}
                      </button>
                  </div>
              )}

              {(kioskStep === 1 || kioskStep === 2) && (
                  <div className="card">
                      <h2>{t('secretTarget')}</h2>
                      <p>{t('tapToPeek')}</p>
                      <div 
                        className="reveal-box" 
                        style={{position: 'relative', cursor: 'pointer', minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center'}}
                        onClick={() => {
                            if (isBlurry) setIsBlurry(false);
                            if (kioskStep === 1) setKioskStep(2);
                        }}
                      >
                          <div className={`blur-overlay ${!isBlurry ? 'revealed' : ''}`}>
                              <h1 style={{fontSize: '3rem', margin: 0, color: 'var(--primary)'}}>{target?.name}</h1>
                              <p className="wishlist-text" style={{marginTop: '20px'}}>{target?.wishlist || t('noWishlist')}</p>
                          </div>
                          {isBlurry && <div className="click-to-reveal-hint">{t('clickToReveal')}</div>}
                      </div>

                      {!isBlurry && (
                          <button className="primary-action" onClick={nextKioskStep} style={{marginTop: '20px'}}>
                              {t('gotIt')}
                          </button>
                      )}
                  </div>
              )}
          </div>
      ) : (
      
      /* --- STANDARD MODE RENDER --- */
      <>
        <h1>{t('secretTarget')}</h1>
        
        {!revealed ? (
            <div className="fade-in">
            <p style={{color: 'white', marginBottom: '30px', fontSize: '1.2rem'}}>{t('spinText')}</p>
            
            <div className="wheel-container">
                <div className="wheel-arrow"></div>
                
                <div 
                    className="wheel" 
                    ref={wheelRef}
                    style={{ 
                        background: `conic-gradient(${gradientString})`
                    }}
                >
                    {wheelNames.map((person, i) => (
                        <div 
                            key={person.id} 
                            className="wheel-text"
                            style={{
                                transform: `rotate(${i * (360 / wheelNames.length) + (360 / wheelNames.length) / 2}deg) translateY(-110px)`
                            }}
                        >
                            {person.name}
                        </div>
                    ))}
                </div>
                
                <div className="wheel-center">🎅</div>
            </div>

            <button 
                className="primary-action"
                onClick={handleSpin}
                disabled={isSpinning}
                style={{ padding: '20px 50px', fontSize: '1.5rem', boxShadow: '0 0 30px rgba(255,215,0,0.5)' }}
            >
                {isSpinning ? t('spinning') : t('spinButton')}
            </button>
            </div>
        ) : (
            <div className="card reveal-box slide-up" style={{position: 'relative'}}>
            <h2 style={{color: '#888', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '2px'}}>{t('giftingTo')}</h2>
            
            {/* Anti-Peeking Wrapper */}
            <div 
                style={{position: 'relative', margin: '20px 0', minHeight: '100px'}} 
                onClick={() => setIsBlurry(!isBlurry)}
            >
                <div className={`blur-overlay ${!isBlurry ? 'revealed' : ''}`}>
                    <h1 style={{ color: 'var(--primary)', fontSize: '3rem', margin: '10px 0' }}>
                        {target.name}
                    </h1>
                </div>
                {isBlurry && <div className="click-to-reveal-hint">{t('clickToReveal')}</div>}
            </div>

            <hr style={{margin: '20px 0', border: '0', borderTop: '1px solid #ddd'}} />
            
            <div style={{textAlign: 'left'}}>
                <h3>{t('theirWishlist')}:</h3>
                <div className="wishlist-text">
                {target.wishlist || t('noWishlist')}
                </div>
            </div>
            
            <Link to={`/lobby/${eventId}`} style={{display: 'inline-block', marginTop: '30px', textDecoration: 'none'}}>
                <button className="outline" style={{borderColor: '#ccc', color: '#888'}}>{t('backToLobby')}</button>
            </Link>
            </div>
        )}
      </>
      )}

      {/* Host Controls Footer */}
      {isAdmin && (
        <div style={{marginTop: '50px', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '20px'}}>
            <p style={{color: '#aaa', fontSize: '0.8rem'}}>{t('hostControls')}</p>
            <button onClick={handleResetEvent} style={{background: 'rgba(0,0,0,0.5)', fontSize: '0.9rem', width: 'auto'}}>
                🔄 {t('resetEvent')}
            </button>
        </div>
      )}
    </div>
  );
}