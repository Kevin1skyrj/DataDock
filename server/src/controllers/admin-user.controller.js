import {
  deleteUser,
  forceUserLogout,
  getUsers,
  hardDeleteUser,
  setUserRole,
  unblockUser as unblockUserService,
} from "../services/admin-user.service.js";

export async function listAllUsers(req, res, next) {
  try {
    const result = await getUsers(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function changeUserRole(req, res, next) {
  try {
    const user = await setUserRole({
      actorId: req.user.id,
      userId: req.params.userId,
      role: req.body?.role,
    });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

export async function logoutUser(req, res, next) {
  try {
    const result = await forceUserLogout({
      actorId: req.user.id,
      userId: req.params.userId,
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function removeUser(req, res, next) {
  try {
    const user = await deleteUser({
      actorId: req.user.id,
      userId: req.params.userId,
    });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

export async function unblockUser(req, res, next) {
  try {
    const user = await unblockUserService({
      actorId: req.user.id,
      userId: req.params.userId,
    });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

export async function permanentlyRemoveUser(req, res, next) {
  try {
    const result = await hardDeleteUser({
      actorId: req.user.id,
      userId: req.params.userId,
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
