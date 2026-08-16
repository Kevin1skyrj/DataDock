import {
  trashItems as trashItemsService,
  listTrashedItems as listTrashedItemsService,
} from "../services/trash.service.js";

export async function trashItems(req, res, next) {
  try {
    const items = await trashItemsService({
      ownerId: req.user.id,
      itemIds: req.body.itemIds,
    });

    res.status(200).json({
      success: true,
      data: items,
    });
  } catch (error) {
    next(error);
  }
}

export async function getTrashedItems(req, res, next) {
  try {
    const result = await listTrashedItemsService({
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
