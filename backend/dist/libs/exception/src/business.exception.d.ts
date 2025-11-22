import { ConflictException, ForbiddenException, NotFoundException, UnauthorizedException, UnprocessableEntityException, type HttpException } from '@nestjs/common/exceptions';
export declare abstract class BusinessException extends Error {
    name: string;
    constructor(message: string);
    abstract convert2HTTPException(message?: string): HttpException;
}
export declare class UnidentifiedException extends BusinessException {
    constructor(credential: any);
    convert2HTTPException(message?: string): UnauthorizedException;
}
export declare class InvalidJwtTokenException extends BusinessException {
    constructor(message: any);
    convert2HTTPException(message?: string): UnauthorizedException;
}
export declare class EntityNotExistException extends BusinessException {
    constructor(entity: any);
    convert2HTTPException(message?: string): NotFoundException;
}
export declare class ConflictFoundException extends BusinessException {
    convert2HTTPException(message?: string): ConflictException;
}
export declare class DuplicateFoundException extends ConflictFoundException {
    constructor(entity: any);
}
export declare class UnprocessableDataException extends BusinessException {
    convert2HTTPException(message?: string): UnprocessableEntityException;
}
export declare class UnprocessableFileDataException extends UnprocessableDataException {
    constructor(message: any, fileName: any);
}
export declare class ForbiddenAccessException extends BusinessException {
    convert2HTTPException(message?: string): ForbiddenException;
}
