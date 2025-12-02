import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="container">
      <div className="text-center" style={{ paddingTop: '4rem' }}>
        <h1 className="mb-2">
          <span style={{ color: 'var(--primary-light)' }}>Menti</span>Clone
        </h1>
        <p className="text-secondary mb-4" style={{ fontSize: '1.25rem' }}>
          Crea presentaciones interactivas y obtén respuestas en tiempo real
        </p>

        <div className="flex-center gap-3 mb-4">
          <Link to="/create" className="btn btn-primary btn-large">
            Crear Presentación
          </Link>
          <Link to="/join" className="btn btn-outline btn-large">
            Unirse con Código
          </Link>
        </div>

        <div className="grid grid-3 gap-3 mt-4" style={{ maxWidth: '900px', margin: '3rem auto' }}>
          <div className="card fade-in">
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
            <h3 className="mb-1">Encuestas</h3>
            <p className="text-secondary">
              Crea encuestas de opción múltiple y ve los resultados al instante
            </p>
          </div>

          <div className="card fade-in" style={{ animationDelay: '0.1s' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>☁️</div>
            <h3 className="mb-1">Nube de Palabras</h3>
            <p className="text-secondary">
              Recopila ideas y visualízalas en una nube de palabras interactiva
            </p>
          </div>

          <div className="card fade-in" style={{ animationDelay: '0.2s' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❓</div>
            <h3 className="mb-1">Preguntas Abiertas</h3>
            <p className="text-secondary">
              Recibe respuestas de texto libre de tu audiencia
            </p>
          </div>
        </div>

        <div className="card" style={{ maxWidth: '600px', margin: '2rem auto' }}>
          <h3 className="mb-2">¿Cómo funciona?</h3>
          <div className="text-secondary" style={{ textAlign: 'left' }}>
            <p className="mb-1"><strong>1.</strong> Crea una nueva presentación</p>
            <p className="mb-1"><strong>2.</strong> Agrega slides con encuestas, nubes de palabras o preguntas</p>
            <p className="mb-1"><strong>3.</strong> Comparte el código de acceso con tu audiencia</p>
            <p><strong>4.</strong> Obtén respuestas en tiempo real</p>
          </div>
        </div>
      </div>
    </div>
  );
}
