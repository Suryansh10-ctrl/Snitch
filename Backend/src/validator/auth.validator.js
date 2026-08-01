import { body, validationResult } from "express-validator";



function validateRequest(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const firstError = errors.array()[0]?.msg || "Validation failed";
        return res.status(400).json({ message: firstError, errors: errors.array() });
    }
    next();
}

export const validateRegisterUser = [
    body("email")
        .isEmail()
        .withMessage("Email must be valid"),

    body("contact")
        .notEmpty()
        .withMessage("Contact is required")
        .matches(/^\d{10}$/)
        .withMessage("Contact must be a 10 digit number"),

    body("fullname")
        .notEmpty()
        .withMessage("Fullname is required")
        .isLength({ min: 3 })
        .withMessage("Fullname must be at least 3 characters long"),

    body("isSeller")
        .optional()
        .isBoolean()
        .withMessage("isSeller must be a boolean value"),

    validateRequest,
];

export const validateLoginUser = [
    body("email")
        .isEmail()
        .withMessage("Email must be valid"),
    body("password")
        .notEmpty()
        .withMessage("Password is required"),
    validateRequest,
];