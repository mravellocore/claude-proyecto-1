const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Almacenamiento en memoria (en producción usar base de datos)
const presentations = new Map();
const activeSessions = new Map();

// Generar código de acceso de 6 dígitos
function generateAccessCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// API REST endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Crear nueva presentación
app.post('/api/presentations', (req, res) => {
  const { title } = req.body;
  const id = uuidv4();
  const accessCode = generateAccessCode();

  const presentation = {
    id,
    title: title || 'Nueva Presentación',
    accessCode,
    slides: [],
    currentSlide: 0,
    createdAt: new Date().toISOString(),
    isActive: false
  };

  presentations.set(id, presentation);
  res.json(presentation);
});

// Obtener presentación por ID
app.get('/api/presentations/:id', (req, res) => {
  const presentation = presentations.get(req.params.id);
  if (!presentation) {
    return res.status(404).json({ error: 'Presentación no encontrada' });
  }
  res.json(presentation);
});

// Obtener presentación por código de acceso
app.get('/api/presentations/join/:code', (req, res) => {
  const presentation = Array.from(presentations.values()).find(
    p => p.accessCode === req.params.code && p.isActive
  );
  if (!presentation) {
    return res.status(404).json({ error: 'Presentación no encontrada o no activa' });
  }
  res.json({
    id: presentation.id,
    title: presentation.title,
    currentSlide: presentation.currentSlide,
    slide: presentation.slides[presentation.currentSlide] || null
  });
});

// Actualizar presentación
app.put('/api/presentations/:id', (req, res) => {
  const presentation = presentations.get(req.params.id);
  if (!presentation) {
    return res.status(404).json({ error: 'Presentación no encontrada' });
  }

  const { title, slides, currentSlide, isActive } = req.body;
  if (title !== undefined) presentation.title = title;
  if (slides !== undefined) presentation.slides = slides;
  if (currentSlide !== undefined) presentation.currentSlide = currentSlide;
  if (isActive !== undefined) presentation.isActive = isActive;

  presentations.set(req.params.id, presentation);
  res.json(presentation);
});

// Agregar slide a presentación
app.post('/api/presentations/:id/slides', (req, res) => {
  const presentation = presentations.get(req.params.id);
  if (!presentation) {
    return res.status(404).json({ error: 'Presentación no encontrada' });
  }

  const { type, question, options } = req.body;
  const slideId = uuidv4();

  const slide = {
    id: slideId,
    type: type || 'poll', // poll, wordcloud, quiz, qa, open
    question: question || '',
    options: options || [],
    responses: [],
    createdAt: new Date().toISOString()
  };

  presentation.slides.push(slide);
  presentations.set(req.params.id, presentation);
  res.json(slide);
});

// Obtener resultados de un slide
app.get('/api/presentations/:id/slides/:slideId/results', (req, res) => {
  const presentation = presentations.get(req.params.id);
  if (!presentation) {
    return res.status(404).json({ error: 'Presentación no encontrada' });
  }

  const slide = presentation.slides.find(s => s.id === req.params.slideId);
  if (!slide) {
    return res.status(404).json({ error: 'Slide no encontrado' });
  }

  res.json(getSlideResults(slide));
});

// Calcular resultados de un slide
function getSlideResults(slide) {
  if (slide.type === 'poll' || slide.type === 'quiz') {
    const counts = {};
    slide.options.forEach(opt => {
      counts[opt] = 0;
    });
    slide.responses.forEach(r => {
      if (counts[r.answer] !== undefined) {
        counts[r.answer]++;
      }
    });
    return {
      type: slide.type,
      question: slide.question,
      options: slide.options,
      results: counts,
      totalResponses: slide.responses.length
    };
  } else if (slide.type === 'wordcloud') {
    const words = {};
    slide.responses.forEach(r => {
      const word = r.answer.toLowerCase().trim();
      words[word] = (words[word] || 0) + 1;
    });
    return {
      type: slide.type,
      question: slide.question,
      words: Object.entries(words).map(([text, count]) => ({ text, count })),
      totalResponses: slide.responses.length
    };
  } else if (slide.type === 'qa' || slide.type === 'open') {
    return {
      type: slide.type,
      question: slide.question,
      answers: slide.responses.map(r => ({
        answer: r.answer,
        timestamp: r.timestamp
      })),
      totalResponses: slide.responses.length
    };
  }
  return { totalResponses: 0 };
}

// Socket.io para tiempo real
io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);

  // Presentador inicia sesión
  socket.on('presenter:start', ({ presentationId }) => {
    const presentation = presentations.get(presentationId);
    if (presentation) {
      presentation.isActive = true;
      presentations.set(presentationId, presentation);
      socket.join(`presentation:${presentationId}`);
      socket.join(`presenter:${presentationId}`);
      activeSessions.set(presentationId, { presenterSocket: socket.id });
      console.log(`Presentación iniciada: ${presentationId}`);
    }
  });

  // Presentador detiene sesión
  socket.on('presenter:stop', ({ presentationId }) => {
    const presentation = presentations.get(presentationId);
    if (presentation) {
      presentation.isActive = false;
      presentations.set(presentationId, presentation);
      io.to(`presentation:${presentationId}`).emit('session:ended');
      activeSessions.delete(presentationId);
    }
  });

  // Presentador cambia de slide
  socket.on('presenter:changeSlide', ({ presentationId, slideIndex }) => {
    const presentation = presentations.get(presentationId);
    if (presentation) {
      presentation.currentSlide = slideIndex;
      presentations.set(presentationId, presentation);
      const currentSlide = presentation.slides[slideIndex];
      io.to(`presentation:${presentationId}`).emit('slide:changed', {
        slideIndex,
        slide: currentSlide
      });
    }
  });

  // Participante se une
  socket.on('participant:join', ({ accessCode, participantName }) => {
    const presentation = Array.from(presentations.values()).find(
      p => p.accessCode === accessCode && p.isActive
    );

    if (presentation) {
      socket.join(`presentation:${presentation.id}`);
      socket.data.presentationId = presentation.id;
      socket.data.participantName = participantName || 'Anónimo';

      const currentSlide = presentation.slides[presentation.currentSlide];
      socket.emit('participant:joined', {
        presentationId: presentation.id,
        title: presentation.title,
        slideIndex: presentation.currentSlide,
        slide: currentSlide
      });

      // Notificar al presentador
      io.to(`presenter:${presentation.id}`).emit('participant:count', {
        count: io.sockets.adapter.rooms.get(`presentation:${presentation.id}`)?.size || 0
      });
    } else {
      socket.emit('error', { message: 'Presentación no encontrada o no activa' });
    }
  });

  // Participante envía respuesta
  socket.on('participant:respond', ({ presentationId, slideId, answer }) => {
    const presentation = presentations.get(presentationId);
    if (presentation) {
      const slide = presentation.slides.find(s => s.id === slideId);
      if (slide) {
        // Evitar respuestas duplicadas del mismo socket
        const existingResponse = slide.responses.find(r => r.odium === socket.id);
        if (!existingResponse) {
          slide.responses.push({
            odium: socket.id,
            participantName: socket.data.participantName || 'Anónimo',
            answer,
            timestamp: new Date().toISOString()
          });
          presentations.set(presentationId, presentation);

          // Enviar resultados actualizados al presentador
          const results = getSlideResults(slide);
          io.to(`presenter:${presentationId}`).emit('results:updated', {
            slideId,
            results
          });

          socket.emit('response:received', { success: true });
        }
      }
    }
  });

  // Presentador solicita resultados
  socket.on('presenter:getResults', ({ presentationId, slideId }) => {
    const presentation = presentations.get(presentationId);
    if (presentation) {
      const slide = presentation.slides.find(s => s.id === slideId);
      if (slide) {
        const results = getSlideResults(slide);
        socket.emit('results:updated', { slideId, results });
      }
    }
  });

  // Presentador limpia respuestas de un slide
  socket.on('presenter:clearResponses', ({ presentationId, slideId }) => {
    const presentation = presentations.get(presentationId);
    if (presentation) {
      const slide = presentation.slides.find(s => s.id === slideId);
      if (slide) {
        slide.responses = [];
        presentations.set(presentationId, presentation);
        io.to(`presenter:${presentationId}`).emit('results:updated', {
          slideId,
          results: getSlideResults(slide)
        });
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('Usuario desconectado:', socket.id);
    if (socket.data.presentationId) {
      io.to(`presenter:${socket.data.presentationId}`).emit('participant:count', {
        count: (io.sockets.adapter.rooms.get(`presentation:${socket.data.presentationId}`)?.size || 1) - 1
      });
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Servidor Mentimeter Clone corriendo en puerto ${PORT}`);
});
