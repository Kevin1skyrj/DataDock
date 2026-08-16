export function errorHandler(error, req, res, next){
    const statusCode = error.statusCode ?? 500;
    const code = error.code ?? "internal-error";

    const message = statusCode === 500 ? "Something went wrong on the server": error.message;
    if(statusCode === 500){
        console.log(error);
    }
    res.status(statusCode).json({
        success: false,
        error:{
            code,
            message,
        }
    });
}