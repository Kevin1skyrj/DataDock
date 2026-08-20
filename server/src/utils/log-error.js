export function logError(context, error) {
  const details = {
    name: error?.name ?? "Error",
    message: error?.message ?? "Unknown error",
    code: error?.code,
    ...(process.env.NODE_ENV === "production"
      ? {}
      : { stack: error?.stack }),
  };

  console.error(context, details);
}
