export enum ErrorType {
    INVALID_PARAMETER = "INVALID_PARAMETER",
    INTERNAL_ERROR = "INTERNAL_ERROR",
    REQUEST_DENIED = "REQUEST_DENIED",
}

export interface Error {
    code: Number;
    type: ErrorType;
    message: string;
}

export const errorHandler = (err: Error, _req: any, res: any, _next: any) => {
    res.status(err.code).send(err);
  }