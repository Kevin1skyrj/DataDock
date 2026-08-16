import {
  createFolder as createFolderService,
  listItems as listItemsService,
} from "../services/item.service.js";

export async function getItems(req, res, next) {
  try {
    const result = await listItemsService({
      ownerId: req.user.id,
      parentId: null,
    });
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function createFolder(req, res, next) {
  try {
    const folder = await createFolderService({
      ownerId: req.user.id,
      name: req.body.name,
      parentId: null,
    });

    res.status(201).json({
      success: true,
      data: folder,
    });
  } catch (error) {
    next(error);
  }
}
