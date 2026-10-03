import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../common/async-handler";
import { created, ok, okPaginated } from "../../common/api-response";
import { parseListQuery } from "../../common/list-query";
import { authenticate } from "../../guards/authenticate";
import { authorize } from "../../guards/authorize";
import { validate } from "../../middleware/validate";
import * as usersService from "./users.service";

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  username: z.string().min(3),
  password: z.string().min(8),
  phone: z.string().optional(),
  avatar: z.string().optional(),
  position: z.string().optional(),
  department: z.string().optional(),
  roleId: z.string().min(1),
  status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED", "PENDING"]).optional(),
});

const updateUserSchema = createUserSchema.omit({ password: true }).partial().extend({ password: z.string().min(8).optional() });

export const usersRouter = Router();
usersRouter.use(authenticate);

usersRouter.get(
  "/",
  authorize("users.read"),
  asyncHandler(async (req, res) => {
    const query = parseListQuery(req);
    const { data, pagination } = await usersService.listUsers(query);
    okPaginated(res, data, pagination);
  })
);

usersRouter.post(
  "/",
  authorize("users.create"),
  validate(createUserSchema),
  asyncHandler(async (req, res) => created(res, await usersService.createUser(req.body, req), "Utilizador criado com sucesso."))
);

usersRouter.get(
  "/:id",
  authorize("users.read"),
  asyncHandler(async (req, res) => ok(res, await usersService.getUserById(req.params.id)))
);

usersRouter.patch(
  "/:id",
  authorize("users.update"),
  validate(updateUserSchema),
  asyncHandler(async (req, res) => ok(res, await usersService.updateUser(req.params.id, req.body, req), "Utilizador actualizado com sucesso."))
);

usersRouter.delete(
  "/:id",
  authorize("users.delete"),
  asyncHandler(async (req, res) => {
    await usersService.deleteUser(req.params.id, req);
    ok(res, null, "Utilizador removido com sucesso.");
  })
);
