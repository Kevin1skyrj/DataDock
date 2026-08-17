export function toPublicItem(item) {
  return {
    id: item._id.toHexString(),
    type: item.type,
    name: item.name,
    parentId: item.parentId?.toHexString() ?? null,
    starred: item.starred,
    trashedAt: item.trashedAt,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    share: item.share ?? null,
  };
}
