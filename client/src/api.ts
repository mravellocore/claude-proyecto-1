import { Presentation, Slide, SlideType } from './types';

const API_URL = '/api';

export async function createPresentation(title: string): Promise<Presentation> {
  const response = await fetch(`${API_URL}/presentations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  return response.json();
}

export async function getPresentation(id: string): Promise<Presentation> {
  const response = await fetch(`${API_URL}/presentations/${id}`);
  if (!response.ok) {
    throw new Error('Presentación no encontrada');
  }
  return response.json();
}

export async function updatePresentation(
  id: string,
  data: Partial<Presentation>
): Promise<Presentation> {
  const response = await fetch(`${API_URL}/presentations/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function addSlide(
  presentationId: string,
  type: SlideType,
  question: string,
  options: string[] = []
): Promise<Slide> {
  const response = await fetch(`${API_URL}/presentations/${presentationId}/slides`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, question, options }),
  });
  return response.json();
}

export async function joinByCode(code: string): Promise<{
  id: string;
  title: string;
  currentSlide: number;
  slide: Slide | null;
}> {
  const response = await fetch(`${API_URL}/presentations/join/${code}`);
  if (!response.ok) {
    throw new Error('Código inválido o presentación no activa');
  }
  return response.json();
}
