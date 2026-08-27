// Thrown by service-layer code to signal a specific HTTP status back to the
// client. tsoa's generated routes just call next(err) on a thrown error, so
// without this each server.ts would need its own ad-hoc status detection —
// see the error-handling middleware registered in each app's server.ts.
export class HttpError extends Error {

  public readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }

}
