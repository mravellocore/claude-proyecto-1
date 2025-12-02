import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getPresentation } from '../api';
import { socket, connectSocket, disconnectSocket } from '../socket';
import { Presentation, SlideResults, Slide } from '../types';

export default function PresenterView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [participantCount, setParticipantCount] = useState(0);
  const [results, setResults] = useState<SlideResults | null>(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    loadPresentation();
  }, [id]);

  useEffect(() => {
    if (!presentation || !id) return;

    connectSocket();

    socket.on('connect', () => {
      socket.emit('presenter:start', { presentationId: id });
      setIsLive(true);
    });

    socket.on('participant:count', ({ count }) => {
      setParticipantCount(count);
    });

    socket.on('results:updated', ({ slideId, results: newResults }) => {
      const currentSlide = presentation.slides[currentSlideIndex];
      if (currentSlide && currentSlide.id === slideId) {
        setResults(newResults);
      }
    });

    return () => {
      socket.emit('presenter:stop', { presentationId: id });
      disconnectSocket();
    };
  }, [presentation, id]);

  useEffect(() => {
    if (!presentation || !id) return;
    const currentSlide = presentation.slides[currentSlideIndex];
    if (currentSlide) {
      socket.emit('presenter:changeSlide', { presentationId: id, slideIndex: currentSlideIndex });
      socket.emit('presenter:getResults', { presentationId: id, slideId: currentSlide.id });
    }
  }, [currentSlideIndex, presentation, id]);

  const loadPresentation = async () => {
    if (!id) return;
    try {
      const data = await getPresentation(id);
      setPresentation(data);
      setCurrentSlideIndex(data.currentSlide);
    } catch (error) {
      console.error('Error loading presentation:', error);
      navigate('/');
    }
  };

  const goToSlide = (index: number) => {
    if (!presentation) return;
    if (index >= 0 && index < presentation.slides.length) {
      setCurrentSlideIndex(index);
      setResults(null);
    }
  };

  const clearResponses = () => {
    if (!id || !presentation) return;
    const currentSlide = presentation.slides[currentSlideIndex];
    if (currentSlide) {
      socket.emit('presenter:clearResponses', { presentationId: id, slideId: currentSlide.id });
    }
  };

  if (!presentation) {
    return (
      <div className="container text-center" style={{ paddingTop: '4rem' }}>
        <p>Cargando presentación...</p>
      </div>
    );
  }

  const currentSlide = presentation.slides[currentSlideIndex];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header
        style={{
          background: 'var(--bg-medium)',
          padding: '1rem 2rem',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="flex-between">
          <div className="flex gap-3" style={{ alignItems: 'center' }}>
            <Link to={`/edit/${id}`} className="btn btn-outline">
              ← Editar
            </Link>
            <h2>{presentation.title}</h2>
            {isLive && <span className="live-indicator">EN VIVO</span>}
          </div>
          <div className="flex gap-2" style={{ alignItems: 'center' }}>
            <span className="participant-count">
              👥 {participantCount} participantes
            </span>
            <div className="access-code" style={{ fontSize: '1.5rem', padding: '0.5rem 1rem' }}>
              {presentation.accessCode}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '2rem' }}>
        {presentation.slides.length === 0 ? (
          <div className="flex-center" style={{ flex: 1 }}>
            <div className="card text-center">
              <h2 className="mb-2">No hay slides</h2>
              <p className="text-secondary mb-3">Agrega slides a tu presentación</p>
              <Link to={`/edit/${id}`} className="btn btn-primary">
                Agregar Slides
              </Link>
            </div>
          </div>
        ) : currentSlide ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="text-center mb-4">
              <span className={`badge badge-${currentSlide.type} mb-2`}>
                {currentSlide.type.toUpperCase()}
              </span>
              <h1 style={{ fontSize: '2.5rem' }}>{currentSlide.question}</h1>
            </div>

            <div style={{ flex: 1 }}>
              <ResultsDisplay slide={currentSlide} results={results} />
            </div>

            <div className="flex-center gap-2 mt-3">
              <button
                className="btn btn-outline"
                onClick={clearResponses}
              >
                Limpiar respuestas
              </button>
            </div>
          </div>
        ) : null}
      </main>

      {/* Slide navigation */}
      {presentation.slides.length > 0 && (
        <footer
          style={{
            background: 'var(--bg-medium)',
            padding: '1rem 2rem',
            borderTop: '1px solid var(--border)',
          }}
        >
          <div className="flex-between">
            <button
              className="btn btn-outline"
              onClick={() => goToSlide(currentSlideIndex - 1)}
              disabled={currentSlideIndex === 0}
            >
              ← Anterior
            </button>

            <div className="slide-nav">
              {presentation.slides.map((_, index) => (
                <div
                  key={index}
                  className={`slide-nav-item ${index === currentSlideIndex ? 'active' : ''}`}
                  onClick={() => goToSlide(index)}
                >
                  {index + 1}
                </div>
              ))}
            </div>

            <button
              className="btn btn-primary"
              onClick={() => goToSlide(currentSlideIndex + 1)}
              disabled={currentSlideIndex === presentation.slides.length - 1}
            >
              Siguiente →
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}

function ResultsDisplay({ slide, results }: { slide: Slide; results: SlideResults | null }) {
  if (!results || results.totalResponses === 0) {
    return (
      <div className="flex-center" style={{ height: '100%', minHeight: '300px' }}>
        <div className="text-center">
          <p className="text-secondary pulse" style={{ fontSize: '1.25rem' }}>
            Esperando respuestas...
          </p>
          <p className="text-secondary mt-2">
            Los participantes pueden unirse con el código mostrado arriba
          </p>
        </div>
      </div>
    );
  }

  if (slide.type === 'poll' || slide.type === 'quiz') {
    const pollResults = results as { results: Record<string, number>; totalResponses: number };
    const maxVotes = Math.max(...Object.values(pollResults.results), 1);

    return (
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <p className="text-secondary text-center mb-3">
          {pollResults.totalResponses} respuesta{pollResults.totalResponses !== 1 ? 's' : ''}
        </p>
        {slide.options.map((option) => {
          const count = pollResults.results[option] || 0;
          const percentage = pollResults.totalResponses > 0
            ? Math.round((count / pollResults.totalResponses) * 100)
            : 0;
          const barWidth = pollResults.totalResponses > 0
            ? Math.round((count / maxVotes) * 100)
            : 0;

          return (
            <div key={option} className="poll-option fade-in">
              <div className="poll-option-bar" style={{ width: `${barWidth}%` }} />
              <div className="poll-option-content">
                <span className="poll-option-text">{option}</span>
                <span className="poll-option-count">
                  {count} ({percentage}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (slide.type === 'wordcloud') {
    const wordResults = results as { words: { text: string; count: number }[]; totalResponses: number };
    const maxCount = Math.max(...wordResults.words.map(w => w.count), 1);

    return (
      <div>
        <p className="text-secondary text-center mb-3">
          {wordResults.totalResponses} respuesta{wordResults.totalResponses !== 1 ? 's' : ''}
        </p>
        <div className="word-cloud">
          {wordResults.words.map((word, index) => {
            const size = 1 + (word.count / maxCount) * 2;
            const colors = ['var(--primary)', 'var(--secondary)', 'var(--warning)', '#8b5cf6', '#06b6d4'];
            const color = colors[index % colors.length];

            return (
              <span
                key={word.text}
                className="word-cloud-item fade-in"
                style={{
                  fontSize: `${size}rem`,
                  background: color,
                  animationDelay: `${index * 0.05}s`,
                }}
              >
                {word.text}
              </span>
            );
          })}
        </div>
      </div>
    );
  }

  if (slide.type === 'qa' || slide.type === 'open') {
    const qaResults = results as { answers: { answer: string; timestamp: string }[]; totalResponses: number };

    return (
      <div style={{ maxWidth: '700px', margin: '0 auto', maxHeight: '400px', overflowY: 'auto' }}>
        <p className="text-secondary text-center mb-3">
          {qaResults.totalResponses} respuesta{qaResults.totalResponses !== 1 ? 's' : ''}
        </p>
        {qaResults.answers.map((item, index) => (
          <div key={index} className="qa-answer fade-in">
            <p className="qa-answer-text">{item.answer}</p>
            <p className="qa-answer-time">
              {new Date(item.timestamp).toLocaleTimeString()}
            </p>
          </div>
        ))}
      </div>
    );
  }

  return null;
}
