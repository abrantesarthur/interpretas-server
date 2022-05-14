export enum ErrorType {
    INVALID_PARAMETER = "INVALID_PARAMETER",
}

export interface Error {
    code: Number;
    type: ErrorType;
    message: string;
}