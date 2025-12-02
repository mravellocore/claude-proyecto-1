import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socket, connectSocket, disconnectSocket } from '../socket';
import { Slide } from '../types';

export default function ParticipantView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [presentationTitle, setPresentationTitle] = useState('');
  const [currentSlide, setCurrentSlide] = useState<Slide | null>(null);
  const [hasResponded, setHasResponded] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [textResponse, setTextResponse] = useState('');
  const [sessionEnded, setSessionEnded] = useState(false);

  useEffect(() => {
    connectSocket();

    socket.on('participant:joined', ({ title, slide }) => {
      setPresentationTitle(title);
      setCurrentSlide(slide);
      setHasResponded(false);
      setSelectedOption(null);
      setTextResponse('');
    });

    socket.on('slide:changed', ({ slide }) => {
      setCurrentSlide(slide);
      setHasResponded(false);
      setSelectedOption(null);
      setTextResponse('');
    });

    socket.on('response:received', () => {
      setHasResponded(true);
    });

    socket.on('session:ended', () => {
      setSessionEnded(true);
    });

    return () => {
      disconnectSocket();
    };
  }, []);

  const submitResponse = (answer: string) => {
    if (!currentSlide || !id || hasResponded) return;

    socket.emit('participant:respond', {
      presentationId: id,
      slideId: currentSlide.id,
      answer,
    });
  };

  const handleOptionClick = (option: string) => {
    if (hasResponded) return;
    setSelectedOption(option);
    submitResponse(option);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textResponse.trim() || hasResponded) return;
    submitResponse(textResponse.trim());
    setTextResponse('');
  };

  if (sessionEnded) {
    return (
      <div className="container">
        <div className="flex-center" style={{ minHeight: '100vh' }}>
          <div className="card text-center">
            <h2 className="mb-2">Sesión finalizada</h2>
            <p className="text-secondary mb-3">
              El presentador ha terminado la sesión
            </p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/join')}
            >
              Unirse a otra presentación
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentSlide) {
    return (
      <div className="container">
        <div className="flex-center" style={{ minHeight: '100vh' }}>
          <div className="text-center">
            <div className="pulse mb-2" style={{ fontSize: '3rem' }}>⏳</div>
            <h2 className="mb-2">Conectado a: {presentationTitle || 'Cargando...'}</h2>
            <p className="text-secondary">Esperando que el presentador inicie...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ minHeight: '100vh', paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <p className="text-secondary text-center mb-2">{presentationTitle}</p>

        <div className="card">
          <span className={`badge badge-${currentSlide.type} mb-2`}>
            {currentSlide.type.toUpperCase()}
          </span>

          <h1 className="mb-4" style={{ fontSize: '1.75rem' }}>
            {currentSlide.question}
          </h1>

          {hasResponded ? (
            <div className="text-center" style={{ padding: '2rem' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✓</div>
              <h2 className="mb-1" style={{ color: 'var(--success)' }}>
                ¡Respuesta enviada!
              </h2>
              <p className="text-secondary">
                Esperando la siguiente pregunta...
              </p>
            </div>
          ) : (
            <>
              {(currentSlide.type === 'poll' || currentSlide.type === 'quiz') && (
                <div>
                  {currentSlide.options.map((option) => (
                    <div
                      key={option}
                      className={`poll-option ${selectedOption === option ? 'selected' : ''}`}
                      onClick={() => handleOptionClick(option)}
                    >
                      <div className="poll-option-content">
                        <span className="poll-option-text">{option}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {(currentSlide.type === 'wordcloud' || currentSlide.type === 'open' || currentSlide.type === 'qa') && (
                <form onSubmit={handleTextSubmit}>
                  <div className="form-group">
                    <input
                      type="text"
                      className="input"
                      placeholder={
                        currentSlide.type === 'wordcloud'
                          ? 'Escribe una palabra...'
                          : 'Escribe tu respuesta...'
                      }
                      value={textResponse}
                      onChange={(e) => setTextResponse(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary btn-large"
                    style={{ width: '100%' }}
                    disabled={!textResponse.trim()}
                  >
                    Enviar
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
