/**
 * Extracts the user-facing error message from an API error response.
 * Always shows the exact message the backend sends; falls back only on
 * network errors or unexpected shapes.
 */
export function getApiError(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response
    if (response?.data?.message) return response.data.message
  }
  if (err instanceof Error && err.message) return err.message
  return fallback
}
