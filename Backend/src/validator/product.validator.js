import { body, validationResult } from "express-validator";


function validateRequest(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const firstError = errors.array()[0]?.msg || "Validation failed";
        return res.status(400).json({ message: firstError, errors: errors.array() });
    }
    next();
}

export const validateCreateProduct = [
    body("title")
        .trim()
        .notEmpty()
        .withMessage("Title is required"),
    body("description")
        .trim()
        .notEmpty()
        .withMessage("Description is required"),
    body("priceAmount")
        .custom((value, { req }) => {
            const val = value || req.body.price;
            if (!val || isNaN(Number(val)) || Number(val) <= 0) {
                throw new Error("Valid price amount is required");
            }
            return true;
        }),
    body("priceCurrency")
        .optional()
        .isIn(["USD", "EUR", "GBP", "JPY", "INR"])
        .withMessage("Invalid currency code"),
    validateRequest,
];