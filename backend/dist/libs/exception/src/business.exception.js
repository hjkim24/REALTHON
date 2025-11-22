"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForbiddenAccessException = exports.UnprocessableFileDataException = exports.UnprocessableDataException = exports.DuplicateFoundException = exports.ConflictFoundException = exports.EntityNotExistException = exports.InvalidJwtTokenException = exports.UnidentifiedException = exports.BusinessException = void 0;
const exceptions_1 = require("@nestjs/common/exceptions");
class BusinessException extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
    }
}
exports.BusinessException = BusinessException;
class UnidentifiedException extends BusinessException {
    constructor(credential) {
        super(`Incorrect ${credential}`);
    }
    convert2HTTPException(message) {
        return new exceptions_1.UnauthorizedException(message ?? this.message);
    }
}
exports.UnidentifiedException = UnidentifiedException;
class InvalidJwtTokenException extends BusinessException {
    constructor(message) {
        super(`Invalid token: ${message}`);
    }
    convert2HTTPException(message) {
        return new exceptions_1.UnauthorizedException(message ?? this.message);
    }
}
exports.InvalidJwtTokenException = InvalidJwtTokenException;
class EntityNotExistException extends BusinessException {
    constructor(entity) {
        super(`${entity} does not exist`);
    }
    convert2HTTPException(message) {
        return new exceptions_1.NotFoundException(message ?? this.message);
    }
}
exports.EntityNotExistException = EntityNotExistException;
class ConflictFoundException extends BusinessException {
    convert2HTTPException(message) {
        return new exceptions_1.ConflictException(message ?? this.message);
    }
}
exports.ConflictFoundException = ConflictFoundException;
class DuplicateFoundException extends ConflictFoundException {
    constructor(entity) {
        super(`${entity} is already in use`);
    }
}
exports.DuplicateFoundException = DuplicateFoundException;
class UnprocessableDataException extends BusinessException {
    convert2HTTPException(message) {
        return new exceptions_1.UnprocessableEntityException(message ?? this.message);
    }
}
exports.UnprocessableDataException = UnprocessableDataException;
class UnprocessableFileDataException extends UnprocessableDataException {
    constructor(message, fileName) {
        super(`${message} @${fileName}`);
    }
}
exports.UnprocessableFileDataException = UnprocessableFileDataException;
class ForbiddenAccessException extends BusinessException {
    convert2HTTPException(message) {
        return new exceptions_1.ForbiddenException(message ?? this.message);
    }
}
exports.ForbiddenAccessException = ForbiddenAccessException;
//# sourceMappingURL=business.exception.js.map