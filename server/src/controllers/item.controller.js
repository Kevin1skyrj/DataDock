import {
  createFolder as createFolderService,
  getFolderPath as getFolderPathService,
  getItem as getItemService,
  listItems as listItemsService,
} from "../services/item.service.js";

export async function getItems(req, res, next) {
  try {
    const result = await listItemsService({
      ownerId: req.user.id,
      parentId: req.query.parentId,
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
  try{
    const item = await getItemService({
      ownerId: req.user.id,
      itemId: req.params.itemId,
    });
    res.status(200).json({
      success: true,
      data: item,
    });
  } catch(error){
    next(error);
  }
}

export async function getFolderPath(req, res, next) {
  try{
    const path = await getFolderPathService({
      ownerId: req.user.id,
      folderId: req.params.folderId,
    });
    res.status(200).json({
      success: true,
      data: path,
    });
  }catch(error){
    next(error);
  }
}
