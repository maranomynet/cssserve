import { FastifyInstance } from 'fastify';

import { AppConfig } from './AppConfig';
import config from './config';

type NormalizedRedirects = Record<
  string,
  | {
      target: string;
      status: 307;
      ttl: number;
    }
  | {
      target: string;
      status: 301;
      ttl?: never;
    }
>;

export const MIN_TTL = 60;

export const _normalizeRedirects = (
  redirects: AppConfig['redirects']
): NormalizedRedirects | undefined => {
  if (!redirects) {
    return;
  }
  return Object.fromEntries(
    Object.entries(redirects).map(([sourcePath, targetInfo]) => {
      const [target, ttlStr] = targetInfo.trim().split('#');
      if (ttlStr === '!') {
        return [sourcePath, { target, status: 301 }];
      }
      const ttl =
        (ttlStr && Math.max(Math.round(parseFloat(ttlStr)), MIN_TTL)) ||
        config.ttl_static;

      return [sourcePath, { target, status: 307, ttl }];
    })
  );
};

export const registerRedirects = (app: FastifyInstance) => {
  const redirects = _normalizeRedirects(config.redirects);
  if (redirects) {
    Object.entries(redirects).forEach(([sourcePath, redirectInfo]) => {
      const { target, status, ttl } = redirectInfo;
      app.get(sourcePath, (req, res) => {
        res.header('Location', target);
        if (ttl !== null) {
          res.header('Cache-Control', `public, max-age=${ttl}, immutable`);
        }
        res.status(status).send('');
      });
    });
  }
};
