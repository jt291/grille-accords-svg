/**
 * Cloudflare Worker entry point that serves the built single-page application.
 *
 * @packageDocumentation
 */

export default {
  /**
   * Serves static assets and falls back to the application shell for routes.
   *
   * @param {Request} request - Incoming HTTP request.
   * @param {{ ASSETS: { fetch(request: Request): Promise<Response> } }} env - Worker bindings.
   * @returns {Promise<Response>} The static asset or application shell response.
   */
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request)
    if (response.status !== 404) return response

    const url = new URL(request.url)
    url.pathname = '/'
    return env.ASSETS.fetch(new Request(url, request))
  },
}
