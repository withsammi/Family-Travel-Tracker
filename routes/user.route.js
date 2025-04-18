import express from "express";
import createUser from "../controller/user.controller.js";

const userRouter = express.Router()

userRouter.post("/greet",createUser)

export default userRouter;