export async function safeFetchJson<T>(
  url: string,
  headers?: Record<string, string>,
  timeoutMs = 15_000
): Promise<T | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mastra Scientific Researcher Agent/1.0',
        ...headers,
      },
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}
