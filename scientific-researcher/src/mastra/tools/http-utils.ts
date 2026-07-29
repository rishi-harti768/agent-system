export async function safeFetchJson<T>(
  url: string,
  headers?: Record<string, string>,
  timeoutMs = 15_000
): Promise<T | null> {
  try {
    const fetchOptions: RequestInit = {
      headers: {
        'User-Agent': 'Mastra Scientific Researcher Agent/1.0',
        ...headers,
      },
    };

    if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
      try {
        fetchOptions.signal = AbortSignal.timeout(timeoutMs);
      } catch {
        // Ignore timeout signal errors if mocked in unit tests
      }
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export function createErrorResponse(query: string, err: unknown) {
  const error = err instanceof Error ? err.message : String(err);
  return {
    query,
    count: 0,
    error,
    results: [],
  };
}

