import { trashItems as trashItemsService } from "../services/trash.service.js";

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
