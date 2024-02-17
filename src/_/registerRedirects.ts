import { FastifyInstance } from 'fastify';

import { AppConfig } from './AppConfig.js';
import config from './config.js';

type RedirectInfo =
  | {
      target: string;
      status: 307;
      ttl: number;
    }
  | {
      target: string;
      status: 301;
      ttl?: never;
    };

type AutoInfo = { auto?: true };

type RedirectEntries = Array<[string, RedirectInfo]>;

type NormalizedRedirects = Record<string, RedirectInfo>;

export const MIN_TTL = 60;

export const _normalizeRedirects = (
  redirects: AppConfig['redirects']
): NormalizedRedirects | undefined => {
  if (!redirects) {
    return;
  }
  return Object.fromEntries(
    Object.entries(redirects)
      .flatMap(([sourcePath, targetInfo]): RedirectEntries => {
        const paths = [sourcePath];
        if (sourcePath.endsWith('/')) {
          paths.push(sourcePath.slice(0, -1));
        }
        let redirectInfo: RedirectInfo;
        const [target, ttlStr] = targetInfo.trim().split('#') as [
          string,
          ...Array<string>
        ];
        if (ttlStr === '!') {
          redirectInfo = { target, status: 301 };
        } else {
          const ttl =
            (ttlStr && Math.max(Math.round(parseFloat(ttlStr)), MIN_TTL)) ||
            config.ttl_static;
          redirectInfo = { target, status: 307, ttl };
        }
        return paths.map((path, i) => {
          const info = i > 0 ? { ...redirectInfo, auto: true } : redirectInfo;
          return [path, info];
        });
      })
      .sort(([, infoA], [, infoB]) =>
        (infoA as AutoInfo).auto && !(infoB as AutoInfo).auto ? -1 : 0
      )
      .map((entry) => {
        delete (entry[1] as AutoInfo).auto;
        return entry;
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
        if (ttl != null) {
          res.header('Cache-Control', `public, max-age=${ttl}, immutable`);
        }
        res.status(status).send('');
      });
    });
  }
};
