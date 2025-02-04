import eventify from './qj/eventify.js';

const { on, emit } = eventify({});

export const onCacheRefresh = (callback: () => void) => {
  on('refresh', callback);
};
export const refreshCache = () => {
  emit('refresh');
};
