import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getPresentation, addSlide, updatePresentation } from '../api';
import { Presentation, Slide, SlideType } from '../types';

export default function EditPresentation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddSlide, setShowAddSlide] = useState(false);
  const [newSlide, setNewSlide] = useState({
    type: 'poll' as SlideType,
    question: '',
    options: ['', ''],
  });

  useEffect(() => {
    loadPresentation();
  }, [id]);

  const loadPresentation = async () => {
    if (!id) return;
    try {
      const data = await getPresentation(id);
      setPresentation(data);
    } catch (error) {
      console.error('Error loading presentation:', error);
      alert('Presentación no encontrada');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlide = async () => {
    if (!id || !newSlide.question.trim()) return;

    const options = newSlide.type === 'poll' || newSlide.type === 'quiz'
      ? newSlide.options.filter(o => o.trim())
      : [];

    try {
      await addSlide(id, newSlide.type, newSlide.question, options);
      await loadPresentation();
      setShowAddSlide(false);
      setNewSlide({ type: 'poll', question: '', options: ['', ''] });
    } catch (error) {
      console.error('Error adding slide:', error);
    }
  };

  const handleDeleteSlide = async (slideId: string) => {
    if (!presentation || !id) return;
    if (!confirm('¿Eliminar este slide?')) return;

    const updatedSlides = presentation.slides.filter(s => s.id !== slideId);
    try {
      await updatePresentation(id, { slides: updatedSlides });
      await loadPresentation();
    } catch (error) {
      console.error('Error deleting slide:', error);
    }
  };

  const addOption = () => {
    setNewSlide(prev => ({
      ...prev,
      options: [...prev.options, ''],
    }));
  };

  const updateOption = (index: number, value: string) => {
    setNewSlide(prev => ({
      ...prev,
      options: prev.options.map((o, i) => (i === index ? value : o)),
    }));
  };

  const removeOption = (index: number) => {
    if (newSlide.options.length <= 2) return;
    setNewSlide(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  const getSlideTypeName = (type: SlideType) => {
    const types: Record<SlideType, string> = {
      poll: 'Encuesta',
      wordcloud: 'Nube de Palabras',
      quiz: 'Quiz',
      qa: 'Q&A',
      open: 'Respuesta Abierta',
    };
    return types[type];
  };

  if (loading) {
    return (
      <div className="container text-center" style={{ paddingTop: '4rem' }}>
        <p>Cargando...</p>
      </div>
    );
  }

  if (!presentation) {
    return null;
  }

  return (
    <div className="container">
      <div className="flex-between mb-3">
        <div>
          <Link to="/" className="text-secondary" style={{ textDecoration: 'none' }}>
            ← Volver
          </Link>
          <h1 className="mt-1">{presentation.title}</h1>
          <p className="text-secondary">
            Código de acceso: <span className="badge badge-poll">{presentation.accessCode}</span>
          </p>
        </div>
        <Link to={`/present/${presentation.id}`} className="btn btn-primary btn-large">
          Presentar
        </Link>
      </div>

      <div className="mb-3">
        <div className="flex-between mb-2">
          <h2>Slides ({presentation.slides.length})</h2>
          <button
            className="btn btn-secondary"
            onClick={() => setShowAddSlide(true)}
          >
            + Agregar Slide
          </button>
        </div>

        {presentation.slides.length === 0 ? (
          <div className="card text-center">
            <p className="text-secondary mb-2">No hay slides todavía</p>
            <button
              className="btn btn-primary"
              onClick={() => setShowAddSlide(true)}
            >
              Crear tu primer slide
            </button>
          </div>
        ) : (
          <div className="grid gap-2">
            {presentation.slides.map((slide, index) => (
              <SlideCard
                key={slide.id}
                slide={slide}
                index={index}
                onDelete={() => handleDeleteSlide(slide.id)}
              />
            ))}
          </div>
        )}
      </div>

      {showAddSlide && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowAddSlide(false)}
        >
          <div
            className="card"
            style={{ width: '100%', maxWidth: '500px', margin: '1rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-3">Agregar Slide</h2>

            <div className="form-group">
              <label>Tipo de slide</label>
              <select
                className="input"
                value={newSlide.type}
                onChange={(e) => setNewSlide(prev => ({ ...prev, type: e.target.value as SlideType }))}
              >
                <option value="poll">Encuesta (opción múltiple)</option>
                <option value="wordcloud">Nube de Palabras</option>
                <option value="quiz">Quiz</option>
                <option value="open">Respuesta Abierta</option>
                <option value="qa">Q&A</option>
              </select>
            </div>

            <div className="form-group">
              <label>Pregunta</label>
              <input
                type="text"
                className="input"
                placeholder="Escribe tu pregunta..."
                value={newSlide.question}
                onChange={(e) => setNewSlide(prev => ({ ...prev, question: e.target.value }))}
              />
            </div>

            {(newSlide.type === 'poll' || newSlide.type === 'quiz') && (
              <div className="form-group">
                <label>Opciones</label>
                {newSlide.options.map((option, index) => (
                  <div key={index} className="flex gap-1 mb-1">
                    <input
                      type="text"
                      className="input"
                      placeholder={`Opción ${index + 1}`}
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                    />
                    {newSlide.options.length > 2 && (
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => removeOption(index)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-outline mt-1"
                  onClick={addOption}
                >
                  + Agregar opción
                </button>
              </div>
            )}

            <div className="flex gap-2 mt-3">
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={handleAddSlide}
                disabled={!newSlide.question.trim()}
              >
                Agregar Slide
              </button>
              <button
                className="btn btn-outline"
                onClick={() => setShowAddSlide(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SlideCard({ slide, index, onDelete }: { slide: Slide; index: number; onDelete: () => void }) {
  const getTypeBadgeClass = (type: SlideType) => {
    const classes: Record<SlideType, string> = {
      poll: 'badge-poll',
      wordcloud: 'badge-wordcloud',
      quiz: 'badge-quiz',
      qa: 'badge-qa',
      open: 'badge-open',
    };
    return classes[type];
  };

  const getTypeLabel = (type: SlideType) => {
    const labels: Record<SlideType, string> = {
      poll: 'Encuesta',
      wordcloud: 'Nube',
      quiz: 'Quiz',
      qa: 'Q&A',
      open: 'Abierta',
    };
    return labels[type];
  };

  return (
    <div className="card fade-in">
      <div className="flex-between">
        <div>
          <span className={`badge ${getTypeBadgeClass(slide.type)} mb-1`}>
            {getTypeLabel(slide.type)}
          </span>
          <h3>Slide {index + 1}</h3>
          <p className="text-secondary">{slide.question}</p>
          {slide.options.length > 0 && (
            <p className="text-secondary" style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Opciones: {slide.options.join(', ')}
            </p>
          )}
        </div>
        <button className="btn btn-danger" onClick={onDelete}>
          Eliminar
        </button>
      </div>
    </div>
  );
}
