export function toPublicItem(item) {
  return {
    id: item._id.toHexString(),
    type: item.type,
    name: item.name,
    parentId: item.parentId?.toHexString() ?? null,
    kind: item.type === "folder" ? "folder" : item.kind,
    mimeType: item.mimeType ?? null,
    size: item.size ?? null,
    itemCount: item.itemCount ?? null,
    starred: item.starred,
    trashedAt: item.trashedAt,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    openedAt: item.openedAt ?? null,
    share: item.share ?? null,
  };
}
