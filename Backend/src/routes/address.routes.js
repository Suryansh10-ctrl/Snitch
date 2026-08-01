import { Router } from "express";
import { addAddress, getUserAddresses, updateAddress, deleteAddress } from "../controller/address.controller.js";
import { authenticateUser } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticateUser);

router.post("/", addAddress);
router.get("/", getUserAddresses);
router.put("/:addressId", updateAddress);
router.delete("/:addressId", deleteAddress);

export default router;
