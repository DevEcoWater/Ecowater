type PaginationParams = {
  url: string;
};

export function getPaginationParams({ url }: PaginationParams) {
  const { searchParams } = new URL(url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  return { page, search, status, limit };
}
