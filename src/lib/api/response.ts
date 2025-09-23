export function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    headers: {
      'content-type': 'application/json; charset=utf-8'
    },
    ...init
  });
}

export function errorResponse(message: string, status = 400) {
  return json({ error: message }, { status });
}
