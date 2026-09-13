import { useEffect, useRef, useState } from 'react';
import { appFetch, assistantText, safeLink } from './client.js';
import { buildArticleStyleRecommendationPrompt, parseArticleStyleRecommendation } from './article-thread.js';
import { TEXT_CHAT_OPTIONS } from './ai-model.js';

const idleState = { status: 'idle', recommendation: null, error: '' };

async function readArticle(source, signal) {
  try {
    const response = await appFetch('/api/scrape-article', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: source }),
      signal
    });
    const data = await response.json();
    if (typeof data.content !== 'string' || !data.content.trim()) throw new Error('Artikel kosong. Gunakan sumber lain.');
    return data.content;
  } catch (error) {
    throw new Error('Artikel tidak dapat dibaca. Coba link sumber lain; konten tidak dibuat agar tidak mengarang isi berita. ' + error.message);
  }
}

export function useArticleRecommendation(source, apiKey) {
  const sourceUrl = safeLink(source) || source.trim();
  const [state, setState] = useState(idleState);
  const activeRequest = useRef(null);
  const articleCache = useRef(null);

  useEffect(() => {
    articleCache.current = null;
    setState(idleState);
    return () => {
      activeRequest.current?.abort();
      activeRequest.current = null;
    };
  }, [sourceUrl, apiKey]);

  const requestRecommendation = async () => {
    if (!safeLink(sourceUrl) || !apiKey) return;
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    articleCache.current = null;
    const isCurrent = () => activeRequest.current === controller && !controller.signal.aborted;
    setState({ ...idleState, source: sourceUrl, status: 'reading' });
    try {
      const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(60_000)]);
      const content = await readArticle(sourceUrl, signal);
      if (!isCurrent()) return;
      articleCache.current = { source: sourceUrl, content };
      setState({ ...idleState, source: sourceUrl, status: 'analyzing' });
      const response = await appFetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}`, 'X-Provider': '1inference' },
        body: JSON.stringify({
          ...TEXT_CHAT_OPTIONS,
          messages: [
            { role: 'system', content: buildArticleStyleRecommendationPrompt() },
            { role: 'user', content: `Link sumber: ${sourceUrl}\n\nIsi artikel:\n"""\n${content}\n"""` }
          ],
          reasoning_effort: 'none',
          max_completion_tokens: 400
        }),
        signal
      });
      const recommendation = parseArticleStyleRecommendation(assistantText(await response.json()));
      if (isCurrent()) setState({ source: sourceUrl, status: 'ready', recommendation, error: '' });
    } catch (error) {
      if (isCurrent()) setState({ ...idleState, source: sourceUrl, status: 'error', error: error.message });
    } finally {
      if (activeRequest.current === controller) activeRequest.current = null;
    }
  };

  const getArticleContent = () => articleCache.current?.source === sourceUrl
    ? Promise.resolve(articleCache.current.content)
    : readArticle(sourceUrl);

  const current = state.source === sourceUrl ? state : idleState;
  return {
    requestRecommendation,
    getArticleContent,
    recommendation: current.recommendation,
    recommendationError: current.error,
    recommendationStatus: current.status,
    isRecommending: ['reading', 'analyzing'].includes(current.status)
  };
}
