import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please enter email and password');
      return;
    }

    setIsLoading(true);
    try {
      // 1) get a fresh CT token (server uses env creds)
      const authRes = await fetch('/api/auth');
      if (!authRes.ok) {
        const t = await authRes.text();
        throw new Error(`Failed to get auth token: ${t}`);
      }
      const { token } = await authRes.json();

      // 2) call your login API WITH the token header
      const resp = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-ct-token': token, // <<< important
        },
        body: JSON.stringify(formData),
      });

      if (resp.ok) {
        const data = await resp.json();
        localStorage.setItem('customer', JSON.stringify(data.customer));
        router.push('/');
        return;
      }

      const err = await resp.json().catch(() => ({}));
      if (resp.status === 403) {
        // Server enforces approval + group
        setError(err.error || 'Your account is pending approval or not in a valid customer group yet.');
      } else if (resp.status === 401) {
        setError('Invalid email or password');
      } else {
        setError(err.error || 'Login failed');
      }
    } catch (e) {
      setError(e.message || 'Error logging in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form onSubmit={handleSubmit} style={{ maxWidth: '400px', width: '100%', padding: '40px', border: '2px solid #d7e9f7', borderRadius: '20px', backgroundColor: '#fff' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Login</h2>
        {error && <p style={{ color: 'red', fontWeight: 600, marginBottom: '20px', textAlign: 'center' }}>{error}</p>}
        <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required style={{ width: '100%', marginBottom: '16px', padding: '16px', borderRadius: '12px', backgroundColor: '#f8fafe', border: 'none' }} />
        <input type="password" placeholder="Password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required style={{ width: '100%', marginBottom: '24px', padding: '16px', borderRadius: '12px', backgroundColor: '#f8fafe', border: 'none' }} />
        <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '16px', backgroundColor: '#0d2340', color: '#fff', border: 'none', borderRadius: '12px' }}>
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
