'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import LevelChip from '@/components/LevelChip';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

interface Me {
  id: number;
  email: string;
  full_name: string;
  phone: string | null;
  role: string;
  level: string | null;
  saldo_a_favor: number;
}

const LEVELS: Record<string, string> = {
  principiante: 'Principiante',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado'
};

export default function PerfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(stored));
  }, [router]);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const res = await fetch(`${apiUrl}/api/auth/me`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setMe(data);
          setFullName(data.full_name);
          setPhone(data.phone || '');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchMe();
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setSavingProfile(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/api/students/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ full_name: fullName, phone: phone || null })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al actualizar el perfil');
        return;
      }
      setInfo('Perfil actualizado correctamente');
      if (user) {
        const updated = { ...user, full_name: fullName };
        localStorage.setItem('user', JSON.stringify(updated));
        setUser(updated);
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setSavingPassword(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/api/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al cambiar la contraseña');
        return;
      }
      setInfo(data.message || 'Contraseña actualizada');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setSavingPassword(false);
    }
  };

  if (!user) return null;

  return (
    <main className="min-h-screen pb-24 md:pb-8">
      <Navigation title="Mi Perfil" />

      <div className="max-w-3xl mx-auto px-4 py-8">
        {error && <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-4">{error}</div>}
        {info && <div className="bg-green-50 text-green-700 p-3 rounded text-sm mb-4">{info}</div>}

        {loading ? (
          <p className="text-gray-500">Cargando perfil...</p>
        ) : me ? (
          <>
            <div className="card mb-6">
              <h3 className="font-semibold mb-4">Datos de la cuenta</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="label">Email (no editable)</label>
                  <input type="text" value={me.email} disabled className="input bg-gray-100" />
                </div>
                <div>
                  <label className="label">Rol</label>
                  <input
                    type="text"
                    value={me.role === 'admin' ? 'Administrador' : me.role === 'profesor' ? 'Profesor/a' : 'Alumno'}
                    disabled
                    className="input bg-gray-100 capitalize"
                  />
                </div>
                <div>
                  <label className="label">Nivel</label>
                  <div className="mt-1">
                    <LevelChip level={me.level} />
                  </div>
                </div>
                {me.role === 'alumno' && (
                  <div>
                    <label className="label">Saldo a favor</label>
                    <p className="font-semibold text-emerald-700">
                      {me.saldo_a_favor > 0 ? `$${me.saldo_a_favor.toLocaleString('es-AR')}` : '—'}
                    </p>
                  </div>
                )}
              </div>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Nombre completo</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Teléfono</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="input"
                    />
                  </div>
                </div>
                <button type="submit" className="btn-primary" disabled={savingProfile}>
                  {savingProfile ? 'Guardando...' : 'Guardar datos'}
                </button>
              </form>
            </div>

            <div className="card">
              <h3 className="font-semibold mb-4">Cambiar contraseña</h3>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="label">Contraseña actual</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="input"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Nueva contraseña</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Confirmar nueva contraseña</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input"
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="btn-primary" disabled={savingPassword}>
                  {savingPassword ? 'Cambiando...' : 'Cambiar contraseña'}
                </button>
              </form>
            </div>
          </>
        ) : (
          <p className="text-gray-500">No se pudo cargar el perfil.</p>
        )}
      </div>
    </main>
  );
}
