import type { ServerSink } from 'meteor/server-render';
import type { Url as NodeUrl } from 'url';

const getBaseUrlFromHeaders = (headers: any) => {
  const protocol = headers['x-forwarded-proto'] || 'https'; // Default to https
  const { host } = headers;
  if (!host) throw new Error('Missing "host" in headers');

  return `${protocol}://${host}`;
};

const createFetchRequest = (sink: ServerSink) => {
  const sinkHeaders = sink.getHeaders();
  const url = sink.request.url as unknown as NodeUrl;
  const headers = new Headers();

  for (const [key, values] of Object.entries(sinkHeaders)) {
    if (values) {
      if (Array.isArray(values)) {
        for (const value of values) {
          headers.append(key, value);
        }
      } else {
        headers.set(key, values);
      }
    }
  }

  const controller = new AbortController();

  const init = { method: 'GET', headers, signal: controller.signal };

  const baseUrl = getBaseUrlFromHeaders(sinkHeaders);
  const fullUrl = `${baseUrl}${url.path || ''}`;

  try {
    const newUrl = new URL(fullUrl);
    return new Request(newUrl, init);
  } catch (error) {
    console.error('Invalid URL:', fullUrl, error);
    throw error; // Re-throw so callers can handle it
  }
};

export default createFetchRequest;
