import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const navigate = useNavigate();
  const { user } = useAuth();

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

    if (isSignUp) {
      // 1. Check if username is taken (by trying to fetch a profile with that username)
      // Since we can't easily query auth.users, we rely on the profile table constraint or duplicate error
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } }
      });

      if (signUpError) {
        setErrorMsg(signUpError.message);
      } else if (data?.user) {
        // 2. Create Profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{ id: data.user.id, username }]);
        
        if (profileError) {
          // If profile fails (e.g. duplicate username constraint), we should probably cleanup auth user
          // But for this simple app, we just show error
          setErrorMsg("Username might be taken or invalid.");
        }
      }
    } else {
      // Login
      const { error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      if (error) setErrorMsg("Invalid username or password.");
    }
    setLoading(false);
  };

  return (
    <div className="container" style={{display: 'flex', alignItems: 'center', minHeight: '80vh'}}>
      <div className="card auth-card fade-in">
        <div style={{fontSize: '4rem', marginBottom: '10px'}}>🎅</div>
        <h1 style={{color: 'var(--primary)', fontSize: '2rem'}}>Secret Santa</h1>
        <p style={{marginBottom: '20px', color: 'var(--text-light)'}}>
          {isSignUp ? "Join the holiday fun!" : "Welcome back!"}
        </p>
        
        {errorMsg && <div style={{color: 'red', marginBottom: '10px', fontSize: '0.9rem'}}>{errorMsg}</div>}

        <form onSubmit={handleAuth}>
          <input 
            placeholder="Username" 
            value={username}
            onChange={e => setUsername(e.target.value)} 
            required 
            autoComplete="username"
          />
          <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={e => setPassword(e.target.value)} 
              autoComplete="current-password"
              required 
          />
          <button className="primary-action" disabled={loading}>
            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Log In')}
          </button>
        </form>
        
        <p 
          className="helper-text" 
          onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(''); }}
          style={{color: 'var(--text-main)', marginTop: '20px', fontSize: '0.9rem', cursor: 'pointer', textDecoration: 'underline'}}
        >
          {isSignUp ? "Already have an account? Log In" : "Don't have an account? Sign Up"}
        </p>
      </div>
    </div>
  );
}