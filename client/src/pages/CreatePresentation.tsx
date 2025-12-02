import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createPresentation } from '../api';

export default function CreatePresentation() {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      const presentation = await createPresentation(title);
      navigate(`/edit/${presentation.id}`);
    } catch (error) {
      console.error('Error creating presentation:', error);
      alert('Error al crear la presentación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div style={{ maxWidth: '500px', margin: '4rem auto' }}>
        <Link to="/" className="text-secondary" style={{ textDecoration: 'none' }}>
          ← Volver al inicio
        </Link>

        <h1 className="mb-3 mt-2">Crear Presentación</h1>

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">Título de la presentación</label>
              <input
                type="text"
                id="title"
                className="input"
                placeholder="Ej: Encuesta de satisfacción"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={loading || !title.trim()}
            >
              {loading ? 'Creando...' : 'Crear Presentación'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
