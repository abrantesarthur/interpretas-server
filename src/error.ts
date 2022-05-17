export enum ErrorType {
    INVALID_PARAMETER = "INVALID_PARAMETER",
    INVALID_REQUEST = "INVALID_REQUEST",
    INTERNAL_ERROR = "INTERNAL_ERROR",
    UNAUTHORIZED = "UNAUTHORIZED",
    NOT_FOUND = "NOT_FOUND",
}

export class Error {
    code: Number;
    type: ErrorType;
    message: String;

    constructor(code: Number, type: ErrorType, message: String) {
        this.code = code;
        this.type = type;
        this.message = message;
    }
}



export const errorHandler = (err: Error, _req: any, res: any, _next: any) => {
    res.status(err.code).send(err);
  }