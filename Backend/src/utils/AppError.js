function AppError(message, statusCode) {
    const error = new Error(message);

    error.statusCode = statusCode;
    error.status = "fail";

    return error;
}

export default AppError;