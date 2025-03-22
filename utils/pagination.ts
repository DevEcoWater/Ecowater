type PaginationParams = {
  url: string;
};

export function getPaginationParams({ url }: PaginationParams) {
  const { searchParams } = new URL(url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}
