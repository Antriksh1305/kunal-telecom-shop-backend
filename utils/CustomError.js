class CustomError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.stack = (new Error()).stack;
    }
}

module.exports = CustomError;
