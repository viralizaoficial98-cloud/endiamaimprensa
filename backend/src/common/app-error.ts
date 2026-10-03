export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errors: string[];

  constructor(message: string, statusCode = 400, errors: string[] = []) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.errors = errors.length > 0 ? errors : [message];
  }

  static badRequest(message: string, errors: string[] = []) {
    return new AppError(message, 400, errors);
  }

  static unauthorized(message = "Não autenticado.") {
    return new AppError(message, 401);
  }

  static forbidden(message = "Não tem permissão para realizar esta operação.") {
    return new AppError(message, 403);
  }

  static notFound(message = "Recurso não encontrado.") {
    return new AppError(message, 404);
  }

  static conflict(message: string) {
    return new AppError(message, 409);
  }

  static tooManyRequests(message = "Demasiados pedidos. Tente novamente mais tarde.") {
    return new AppError(message, 429);
  }

  static internal(message = "Erro interno do servidor.") {
    return new AppError(message, 500);
  }
}
