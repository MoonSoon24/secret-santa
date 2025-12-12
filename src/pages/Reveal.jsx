import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
  
  const [target, setTarget] = useState(null);
  const [wheelNames, setWheelNames] = useState([]); 
  
  const [revealed, setRevealed] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isHost, setIsHost] = useState(false);
  
  const wheelRef = useRef(null);

  const SEGMENT_COLORS = ['#D42426', '#165B33', '#F8B229', '#2C3E50', '#8E44AD', '#E67E22', '#1ABC9C', '#2980B9'];

  useEffect(() => {
    async function initData() {
      const { data: event } = await supabase.from('events').select('host_id').eq('id', eventId).single();
      if (event?.host_id === user.id) setIsHost(true);

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
              .select('wishlist')
              .eq('event_id', eventId)
              .eq('user_id', myRow.target_id)
              .single();
            
            const { data: targetProfile } = await supabase
                .from('profiles')
                .select('username, id')
                .eq('id', myRow.target_id)
                .single();

            setTarget({
                id: targetProfile?.id,
                wishlist: targetParticipant?.wishlist,
                profiles: targetProfile || { username: t('unknown') }
            });
          }
      }

      const { data: allParts } = await supabase
        .from('participants')
        .select('user_id')
        .eq('event_id', eventId);
      
      if (allParts && allParts.length > 0) {
        const ids = allParts.map(p => p.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', ids);
        
        const names = profiles.map(p => ({ id: p.id, name: p.username }));
        names.sort(() => Math.random() - 0.5);
        setWheelNames(names);
      }
    }
    initData();
  }, []);

  const handleSpin = () => {
    if (!target || wheelNames.length === 0) return;
    setIsSpinning(true);

    const winnerIndex = wheelNames.findIndex(p => p.id === target.id);
    if (winnerIndex === -1) {
        notify("Error: Target not found in wheel list.", "error");
        setIsSpinning(false);
        return;
    }

    const segmentCount = wheelNames.length;
    const segmentAngle = 360 / segmentCount;
    const winnerCenterAngle = (winnerIndex * segmentAngle) + (segmentAngle / 2);
    
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

  if (!target) return <div className="container" style={{color: 'white', textAlign: 'center'}}>{t('loadingSecret')}</div>;

  const gradientString = wheelNames.map((_, i) => {
    const start = (i / wheelNames.length) * 100;
    const end = ((i + 1) / wheelNames.length) * 100;
    const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
    return `${color} ${start}% ${end}%`;
  }).join(', ');

  return (
    <div className="container" style={{ textAlign: 'center', minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
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
        <div className="card reveal-box slide-up">
          <h2 style={{color: '#888', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '2px'}}>{t('giftingTo')}</h2>
          <h1 style={{ color: 'var(--primary)', fontSize: '3rem', margin: '10px 0' }}>
            {target.profiles.username}
          </h1>
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

      {isHost && (
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