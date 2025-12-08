'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push('/');
        } catch (err: any) {
            console.error("Login Error:", err);
            console.log("Environment:", process.env.NODE_ENV);
            setError(`Login failed: ${err.code} - ${err.message}`);
        }
    };

    return (
        <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', background: '#f5f5f5' }}>
            <form onSubmit={handleLogin} style={{ padding: '40px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', width: '300px' }}>
                <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>Kobe Maruka Login</h2>
                {error && <p style={{ color: 'red', marginBottom: '10px', fontSize: '14px' }}>{error}</p>}
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc' }}
                    />
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc' }}
                    />
                </div>
                <button
                    type="submit"
                    style={{ width: '100%', padding: '10px', background: 'black', color: 'white', border: 'none', cursor: 'pointer' }}
                >
                    Sign In
                </button>
            </form>
        </div>
    );
}
