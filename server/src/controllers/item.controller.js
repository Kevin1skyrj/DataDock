import { listItems as listItemsService } from "../services/item.service.js";

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
