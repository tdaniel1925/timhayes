export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

export const onRequestError = async (
  err: Error,
  request: {
    path: string;
  },
  context: {
    routerKind: 'Pages Router' | 'App Router';
    routePath: string;
    routeType: 'render' | 'route' | 'action' | 'middleware';
  }
) => {
  // Log errors to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('[Instrumentation Error]', {
      error: err,
      path: request.path,
      context,
    });
  }

  // Sentry will automatically capture the error via the Sentry SDK
};
