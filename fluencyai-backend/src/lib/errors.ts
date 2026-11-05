export class AppError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const notFound = (msg = 'Recurso nao encontrado.') => new AppError(404, msg);
export const badRequest = (msg = 'Requisicao invalida.') => new AppError(400, msg);
