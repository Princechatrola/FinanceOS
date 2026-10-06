export async function parseApiResponse(response) {
  const contentType =
    response.headers.get("content-type") || "";

  if (
    contentType.includes("application/json")
  ) {
    try {
      return await response.json();
    } catch (error) {
      console.error(
        "Failed to parse JSON response:",
        error
      );

      return {
        success: false,
        message:
          "Server returned an invalid JSON response.",
      };
    }
  }

  const text =
    await response.text();

  console.error(
    "Non-JSON server response:",
    text
  );

  return {
    success: false,
    message:
      text ||
      `Server returned HTTP ${response.status}`,
  };
}