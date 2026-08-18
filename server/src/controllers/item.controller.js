import {
  createFolder as createFolderService,
  getFolderPath as getFolderPathService,
  getItem as getItemService,
  getItemDownload as getItemDownloadService,
  getItemPreview as getItemPreviewService,
  listItems as listItemsService,
  renameItem as renameItemService,
  starItems as starItemsService,
  listStarredItems as listStarredItemsService,
  moveItems as moveItemsService,
  listFolders as listFoldersService,
  getFolderSummary as getFolderSummaryService,
  duplicateItems as duplicateItemsService,
} from "../services/item.service.js";

export async function getItems(req, res, next) {
  try {
    const result = await listItemsService({
      ownerId: req.user.id,
      parentId: req.query.parentId,
      view: req.query.view,
      kinds: typeof req.query.kinds === "string" ? req.query.kinds.split(",").filter(Boolean) : [],
      query: req.query.q,
      sortField: req.query.sort,
      sortDirection: req.query.direction,
    });
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function duplicateItems(req, res, next) {
  try {
    const items = await duplicateItemsService({
      ownerId: req.user.id,
      itemIds: req.body.itemIds,
    });
    res.status(201).json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
}

export async function createFolder(req, res, next) {
  try {
    const folder = await createFolderService({
      ownerId: req.user.id,
      name: req.body.name,
      parentId: req.body.parentId,
    });

    res.status(201).json({
      success: true,
      data: folder,
    });
  } catch (error) {
    next(error);
  }
}

export async function getItem(req, res, next) {
  try {
    const item = await getItemService({
      ownerId: req.user.id,
      itemId: req.params.itemId,
    });
    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
}

export async function downloadItem(req, res, next) {
  try {
    const download = await getItemDownloadService({
      ownerId: req.user.id,
      itemId: req.params.itemId,
    });
    res.status(200).json({ success: true, data: download });
  } catch (error) {
    next(error);
  }
}

export async function previewItem(req, res, next) {
  try {
    const preview = await getItemPreviewService({
      ownerId: req.user.id,
      itemId: req.params.itemId,
    });
    res.status(200).json({ success: true, data: preview });
  } catch (error) {
    next(error);
  }
}

export async function getFolderPath(req, res, next) {
  try {
    const path = await getFolderPathService({
      ownerId: req.user.id,
      folderId: req.params.folderId,
    });
    res.status(200).json({
      success: true,
      data: path,
    });
  } catch (error) {
    next(error);
  }
}

export async function renameItem(req, res, next) {
  try {
    const item = await renameItemService({
      ownerId: req.user.id,
      itemId: req.params.itemId,
      name: req.body.name,
    });
    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
}

export async function starItems(req, res, next) {
  try {
    const items = await starItemsService({
      ownerId: req.user.id,
      itemIds: req.body.itemIds,
      starred: req.body.starred,
    });

    res.status(200).json({
      success: true,
      data: items,
    });
  } catch (error) {
    next(error);
  }
}

export async function getStarredItems(req, res, next) {
  try {
    const result = await listStarredItemsService({
      ownerId: req.user.id,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function moveItems(req, res, next) {
  try {
    const items = await moveItemsService({
      ownerId: req.user.id,
      itemIds: req.body.itemIds,
      parentId: req.body.parentId,
    });

    res.status(200).json({
      success: true,
      data: items,
    });
  } catch (error) {
    next(error);
  }
}

export async function getFolders(req, res, next) {
  try {
    const folders = await listFoldersService({
      ownerId: req.user.id,
      parentId: req.query.parentId,
    });

    res.status(200).json({
      success: true,
      data: folders,
    });
  } catch (error) {
    next(error);
  }
}

export async function getFolderSummary(req, res, next) {
  try {
    const summary = await getFolderSummaryService({
      ownerId: req.user.id,
      parentId: req.query.parentId,
    });

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
}
