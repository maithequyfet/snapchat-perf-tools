import NextAuth, { AuthOptions } from 'next-auth';
import { Profile } from '@models/User';

const authRedirectUri = process.env.NEXTAUTH_REDIRECT_URI;
const authClientId = process.env.NEXTAUTH_CLIENT_ID || '';
const authSecret = process.env.NEXTAUTH_SECRET || '';

export interface AuthObject {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  error?: any;
}

async function refreshAccessToken(authObject: AuthObject) {
  let headers = new Headers();
  headers.append('Content-Type', 'application/x-www-form-urlencoded');

  var urlencoded = new URLSearchParams();
  urlencoded.append('refresh_token', authObject.refresh_token);
  urlencoded.append('client_id', authClientId);
  urlencoded.append('client_secret', authSecret);
  urlencoded.append('grant_type', 'refresh_token');

  var requestOptions = {
    method: 'POST',
    headers,
    body: urlencoded,
    redirect: 'follow',
  };

  try {
    // Get a new set of tokens with a refreshToken
    const response = await fetch('https://accounts.snapchat.com/login/oauth2/access_token', requestOptions as any);

    const result: AuthObject = await response.json();

    return { ...authObject, ...result };
  } catch (error) {
    return {
      ...authObject,
      error: 'RefreshAccessTokenError',
    };
  }
}

export const authOptions: AuthOptions = {
  providers: [
    {
      id: 'snapchat',
      name: 'Snapchat',
      type: 'oauth',
      clientId: authClientId,
      clientSecret: authSecret,
      checks: 'state',
      authorization: {
        url: 'https://accounts.snapchat.com/login/oauth2/authorize',
        params: {
          client_id: authClientId,
          redirect_uri: authRedirectUri,
          response_type: 'code',
          scope: 'snapchat-marketing-api',
        },
      },
      token: {
        url: 'https://accounts.snapchat.com/login/oauth2/access_token',
      },
      userinfo: 'https://adsapi.snapchat.com/v1/me',
      profile(response: Profile) {
        return {
          id: response.me.id || '',
          name: response.me.display_name || '',
          email: response.me.email || '',
        };
      },
      style: {
        logo: 'https://accounts.snapchat.com/accounts/static/images/ghost/snapchat-app-icon.svg',
        logoDark: 'https://accounts.snapchat.com/accounts/static/images/ghost/snapchat-app-icon.svg',
        bg: '#fffc00',
        text: '#16191c',
        bgDark: '#fffc00',
        textDark: '#16191c',
      },
    },
  ],
  callbacks: {
    async jwt({ token, account }: any) {
      if (account?.access_token && account?.refresh_token) {
        token.access_token = account.access_token;
        token.refresh_token = account.refresh_token;
      }

      const shouldRefreshTime = Math.round(token.expires_in - 60 * 60 * 1000 - Date.now());

      if (shouldRefreshTime > 0) {
        return Promise.resolve(token);
      }

      token = refreshAccessToken(token);

      return Promise.resolve(token);
    },
    session: async ({ session, token }: any) => {
      session.access_token = token.access_token;
      session.expires_in = token.expires_in;
      session.error = token.error;

      return Promise.resolve(session);
    },
  },
};
export default NextAuth(authOptions);
