import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { socket, connectSocket } from '../socket';

export default function ParticipantJoin() {
  const [accessCode, setAccessCode] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim()) return;

    setLoading(true);
    setError('');

    connectSocket();

    socket.emit('participant:join', {
      accessCode: accessCode.trim(),
      participantName: name.trim() || 'Anónimo',
    });

    socket.once('participant:joined', ({ presentationId }) => {
      navigate(`/participate/${presentationId}`);
    });

    socket.once('error', ({ message }) => {
      setError(message || 'Error al unirse');
      setLoading(false);
    });

    // Timeout after 5 seconds
    setTimeout(() => {
      if (loading) {
        setError('Tiempo de espera agotado. Verifica el código e intenta de nuevo.');
        setLoading(false);
      }
    }, 5000);
  };

  return (
    <div className="container">
      <div style={{ maxWidth: '400px', margin: '4rem auto' }}>
        <Link to="/" className="text-secondary" style={{ textDecoration: 'none' }}>
          ← Volver al inicio
        </Link>

        <h1 className="mb-1 mt-2">Unirse</h1>
        <p className="text-secondary mb-3">
          Ingresa el código de acceso para participar
        </p>

        <div className="card">
          <form onSubmit={handleJoin}>
            <div className="form-group">
              <label htmlFor="code">Código de acceso</label>
              <input
                type="text"
                id="code"
                className="input"
                placeholder="123456"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                style={{
                  fontSize: '2rem',
                  textAlign: 'center',
                  letterSpacing: '0.5rem',
                  fontFamily: 'monospace',
                }}
                autoFocus
                maxLength={6}
              />
            </div>

            <div className="form-group">
              <label htmlFor="name">Tu nombre (opcional)</label>
              <input
                type="text"
                id="name"
                className="input"
                placeholder="Anónimo"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {error && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid var(--danger)',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginBottom: '1rem',
                  color: 'var(--danger)',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-large"
              style={{ width: '100%' }}
              disabled={loading || accessCode.length !== 6}
            >
              {loading ? 'Conectando...' : 'Unirse'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
