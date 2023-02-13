declare const process: {
  env: { [key: string]: string | undefined };
};

// Check if we are running in a Node.js environment
export const isNode =
  typeof process !== 'undefined' &&
  // eslint-disable-next-line no-prototype-builtins
  process.hasOwnProperty('env') &&
  // eslint-disable-next-line no-prototype-builtins
  process.env.hasOwnProperty('NODE_ENV');

interface RequestInitTimeout extends RequestInit {
  timeout?: number;
}

export async function fetchWithTimeout(
  resource: string,
  options: RequestInitTimeout = {}
) {
  const { timeout = 8000 } = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const response = await fetch(resource, {
    ...options,
    signal: controller.signal,
  });
  clearTimeout(id);
  return response;
}
