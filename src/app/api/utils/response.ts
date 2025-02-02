function errorResponse(error: unknown, message: string) {
  let errorMessage = 'An unknown error occurred';
  if (error instanceof Error) {
    errorMessage = error.message;
  }
  return new Response(JSON.stringify({ error: message, details: errorMessage }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' },
  });
}
