import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // View state: 'initial' | 'login' | 'signup'
  const [view, setView] = useState('initial');
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  // Redirect to dashboard if user is already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const getFakeEmail = (user) => `${user.toLowerCase().replace(/\s+/g, '')}@secretsanta.local`;

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    const email = getFakeEmail(username);
    const isSignUp = view === 'signup';

    if (isSignUp) {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } }
      });

      if (authError) {
        setErrorMsg(authError.message);
      } else if (data?.user) {
        //SKip profile creation if user object missing or error
        const { error:jfError } = await supabase
          .from('profiles')
          .insert([{ id: data.user.id, username }]);
        
        if (jfError) {
          setErrorMsg(t('authErrorSignup'));
        }
      }
    } else {
      // Login
      const { error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      if (error) setErrorMsg(t('authErrorLogin'));
    }
    setLoading(false);
  };

  const renderInitialView = () => (
    <div className="fade-in" style={{
      width: '100%', 
      maxWidth: '320px', // Restricted to typical mobile width
      margin: '0 auto', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '15px'
    }}>
      
      {/* Create Account Button */}
      <button 
        className="primary-action" 
        onClick={() => setView('signup')}
        style={{
          width: '100%', 
          minHeight: '85px', // Fixed min-height to prevent jumping
          padding: '15px 20px', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: '4px'
        }}
      >
        <span style={{fontSize: '1.1rem', fontWeight: 'bold', lineHeight: '1.2'}}>{t('createAccount')}</span>
        <span style={{fontSize: '0.85rem', fontWeight: 'normal', opacity: 0.9, lineHeight: '1.2'}}>{t('createNew')}</span>
      </button>

      {/* Login Button */}
      <button 
        className="outline" 
        onClick={() => setView('login')}
        style={{
          width: '100%', 
          minHeight: '85px', // Fixed min-height to prevent jumping
          padding: '15px 20px', 
          background: 'white', 
          color: 'var(--text-main)', 
          borderColor: '#ddd',
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: '4px'
        }}
      >
        <span style={{fontSize: '1.1rem', fontWeight: 'bold', lineHeight: '1.2'}}>{t('loginButton')}</span>
        <span style={{fontSize: '0.85rem', fontWeight: 'normal', color: '#666', lineHeight: '1.2'}}>{t('useExisting')}</span>
      </button>

    </div>
  );

  const renderForm = () => (
    <div className="fade-in" style={{width: '100%', maxWidth: '320px', margin: '0 auto'}}>
      <form onSubmit={handleAuth}>
        <input 
          placeholder={t('username')} 
          value={username}
          onChange={e => setUsername(e.target.value)} 
          required 
          autoComplete="username"
        />
        <input 
            type="password" 
            placeholder={t('password')} 
            value={password}
            onChange={e => setPassword(e.target.value)} 
            autoComplete="current-password"
            required 
        />
        <button className="primary-action" disabled={loading} style={{marginBottom: '20px', marginTop: '10px'}}>
          {loading ? t('processing') : (view === 'signup' ? t('signupAction') : t('loginAction'))}
        </button>
      </form>
      
      {/* Switch Mode Link */}
      <p 
        onClick={() => {
            setErrorMsg('');
            setView(view === 'login' ? 'signup' : 'login');
        }}
        style={{
            textAlign: 'center', 
            cursor: 'pointer', 
            color: 'var(--secondary)', 
            textDecoration: 'underline',
            fontSize: '0.9rem',
            marginTop: '10px'
        }}
      >
        {view === 'login' ? t('orSignup') : t('orLogin')}
      </p>
    </div>
  );

  return (
    <div className="container" style={{display: 'flex', alignItems: 'center', minHeight: '80vh'}}>
      <div className="card auth-card fade-in" style={{width: '100%'}}>
        <div style={{fontSize: '4rem', marginBottom: '10px'}}>🎅</div>
        <h1 style={{color: 'var(--primary)', fontSize: '2rem'}}>{t('appName')}</h1>
        
        {/* Dynamic Header Text */}
        <p style={{marginBottom: '30px', color: 'var(--text-light)'}}>
          {view === 'signup' ? t('joinFun') : t('welcome')}
        </p>
        
        {errorMsg && <div style={{color: '#D42426', background: '#ffebee', padding: '10px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem'}}>{errorMsg}</div>}

        {view === 'initial' ? renderInitialView() : renderForm()}
        
      </div>
    </div>
  );
}