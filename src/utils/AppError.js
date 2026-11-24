// Error con código HTTP, para lanzarlo desde los services
export class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
