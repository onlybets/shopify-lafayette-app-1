export function createRequest(url: string, options?: RequestInit): Request {
  return new Request(url, options);
}
