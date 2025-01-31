import type { AuthObject } from '@clerk/backend/internal';
import { AuthStatus, constants, signedInAuthObject, signedOutAuthObject } from '@clerk/backend/internal';
import { decodeJwt } from '@clerk/backend/jwt';

import { withLogger } from '../utils/debugLogger';
import { API_URL, API_VERSION, SECRET_KEY } from './constants';
import { getAuthAuthHeaderMissing } from './errors';
import type { RequestLike } from './types';
import { getAuthKeyFromRequest, getCookie, getHeader } from './utils';

export const createGetAuth = ({
  noAuthStatusMessage,
  debugLoggerName,
}: {
  debugLoggerName: string;
  noAuthStatusMessage: string;
}) =>
  withLogger(debugLoggerName, logger => {
    return (req: RequestLike, opts?: { secretKey?: string }): AuthObject => {
      if (getHeader(req, constants.Headers.EnableDebug) === 'true') {
        logger.enable();
      }

      // When the auth status is set, we trust that the middleware has already run
      // Then, we don't have to re-verify the JWT here,
      // we can just strip out the claims manually.
      const authToken = getAuthKeyFromRequest(req, 'AuthToken');
      const authMessage = getAuthKeyFromRequest(req, 'AuthMessage');
      const authReason = getAuthKeyFromRequest(req, 'AuthReason');
      const authStatus = getAuthKeyFromRequest(req, 'AuthStatus') as AuthStatus;
      logger.debug('Headers debug', { authStatus, authMessage, authReason });

      if (!authStatus) {
        throw new Error(noAuthStatusMessage);
      }

      const options = {
        authStatus,
        apiUrl: API_URL,
        apiVersion: API_VERSION,
        authMessage,
        secretKey: opts?.secretKey || SECRET_KEY,
        authReason,
      };

      logger.debug('Options debug', options);

      if (authStatus === AuthStatus.SignedIn) {
        const { data: jwt, errors } = decodeJwt(authToken as string);
        if (errors) {
          throw errors[0];
        }

        logger.debug('JWT debug', jwt.raw.text);
        // @ts-expect-error - TODO @nikos: Align types
        return signedInAuthObject({ ...options, sessionToken: jwt.raw.text }, jwt.payload);
      }

      return signedOutAuthObject(options);
    };
  });

export const getAuth = createGetAuth({
  debugLoggerName: 'getAuth()',
  noAuthStatusMessage: getAuthAuthHeaderMissing(),
});

export const parseJwt = (req: RequestLike) => {
  const cookieToken = getCookie(req, constants.Cookies.Session);
  const headerToken = getHeader(req, 'authorization')?.replace('Bearer ', '');
  const { data, errors } = decodeJwt(cookieToken || headerToken || '');

  if (errors) {
    throw errors[0];
  }

  return data;
};
