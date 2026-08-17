import { ObjectId } from "mongodb";

import { AppError } from "../errors/app-error.js";
import {
  findUserById,
  listUsers,
  softDeleteUser,
  unblockUserById,
  permanentlyDeleteUser,
  updateUserRole,
} from "../models/user.model.js";
import { deleteAllUserSessions } from "./session.service.js";

function publicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role ?? "user",
    verified: Boolean(user.emailVerifiedAt),
    deletedAt: user.deletedAt ?? null,
    createdAt: user.createdAt,
  };
}

function parseUserId(userId) {
  if (!ObjectId.isValid(userId)) {
    throw new AppError("Invalid user ID", {
      statusCode: 400,
      code: "invalid-user-id",
    });
  }

  return new ObjectId(userId);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function getUsers(input = {}) {
  const page = Math.max(1, Number.parseInt(input.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(input.limit, 10) || 20));
  const query = {};

  if (["user", "admin", "owner"].includes(input.role)) {
    query.role = input.role;
  }

  if (input.status === "deleted") {
    query.deletedAt = { $exists: true };
  } else if (input.status !== "all") {
    query.deletedAt = { $exists: false };
  }

  if (typeof input.search === "string" && input.search.trim()) {
    const search = new RegExp(escapeRegex(input.search.trim()), "i");
    query.$or = [{ name: search }, { email: search }];
  }

  const result = await listUsers({
    query,
    skip: (page - 1) * limit,
    limit,
  });

  return {
    users: result.items.map(publicUser),
    page,
    limit,
    total: result.total,
    totalPages: Math.ceil(result.total / limit),
  };
}

export async function setUserRole({ actorId, userId, role }) {
  const targetId = parseUserId(userId);

  if (actorId.equals(targetId)) {
    throw new AppError("You cannot change your own role", {
      statusCode: 400,
      code: "self-role-change-forbidden",
    });
  }

  if (!["user", "admin"].includes(role)) {
    throw new AppError("Role must be user or admin", {
      statusCode: 400,
      code: "invalid-role",
    });
  }

  const user = await updateUserRole({ userId: targetId, role });

  if (!user) {
    throw userNotFound();
  }

  await deleteAllUserSessions(targetId);
  return publicUser(user);
}

export async function unblockUser({ actorId, userId }) {
  const targetId = parseUserId(userId);

  if (actorId.equals(targetId)) {
    throw new AppError("The owner account cannot be unblocked here", {
      statusCode: 400,
      code: "self-action-forbidden",
    });
  }

  const user = await unblockUserById(targetId);

  if (!user) {
    throw userNotFound();
  }

  return publicUser(user);
}

export async function hardDeleteUser({ actorId, userId }) {
  const targetId = parseUserId(userId);

  if (actorId.equals(targetId)) {
    throw new AppError("The owner account cannot delete itself", {
      statusCode: 400,
      code: "self-delete-forbidden",
    });
  }

  const user = await findUserById(targetId);

  if (!user?.deletedAt || user.role === "owner") {
    throw new AppError("Only a blocked non-owner user can be permanently deleted", {
      statusCode: 409,
      code: "hard-delete-not-allowed",
    });
  }

  await permanentlyDeleteUser(targetId);
  return { deleted: true };
}

export async function forceUserLogout({ actorId, userId }) {
  const targetId = parseUserId(userId);

  if (actorId.equals(targetId)) {
    throw new AppError("Use your account menu to sign yourself out", {
      statusCode: 400,
      code: "self-logout-forbidden",
    });
  }

  const user = await findUserById(targetId);

  if (!user || user.deletedAt) {
    throw userNotFound();
  }

  await deleteAllUserSessions(targetId);
  return { loggedOut: true };
}

export async function deleteUser({ actorId, userId }) {
  const targetId = parseUserId(userId);

  if (actorId.equals(targetId)) {
    throw new AppError("Administrators cannot delete themselves", {
      statusCode: 400,
      code: "self-delete-forbidden",
    });
  }

  const user = await softDeleteUser({
    userId: targetId,
    deletedBy: actorId,
  });

  if (!user) {
    throw userNotFound();
  }

  await deleteAllUserSessions(targetId);
  return publicUser(user);
}

function userNotFound() {
  return new AppError("User not found", {
    statusCode: 404,
    code: "user-not-found",
  });
}
