import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { username } } // Save username in metadata
      });
      if (error) alert(error.message);
      else {
        // Create public profile record
        await supabase.from('profiles').insert([{ id: data.user.id, username }]);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="container">
      <h1>Secret Santa 🎅</h1>
      <form onSubmit={handleAuth}>
        {isSignUp && (
          <input placeholder="Username" onChange={e => setUsername(e.target.value)} required />
        )}
        <input type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} required />
        <input 
            type="password" 
            placeholder="Password" 
            onChange={e => setPassword(e.target.value)} 
            autoComplete="current-password"  // <-- Tambahkan ini
            required 
        />
        <button disabled={loading}>{isSignUp ? 'Sign Up' : 'Log In'}</button>
      </form>
      <p onClick={() => setIsSignUp(!isSignUp)} style={{cursor: 'pointer', color: 'blue'}}>
        {isSignUp ? "Already have an account? Log In" : "Need an account? Sign Up"}
      </p>
    </div>
  );
}