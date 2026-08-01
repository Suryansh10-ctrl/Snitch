import addressModel from "../models/address.model.js";

export const addAddress = async (req, res) => {
    try {
        const { fullName, contact, streetAddress, city, state, pincode, landmark, addressType, isDefault } = req.body;

        if (!fullName || !contact || !streetAddress || !city || !state || !pincode) {
            return res.status(400).json({
                message: "Please fill out all required address fields.",
                success: false
            });
        }

        const existingCount = await addressModel.countDocuments({ user: req.user._id });
        const shouldBeDefault = isDefault || existingCount === 0;

        if (shouldBeDefault) {
            await addressModel.updateMany({ user: req.user._id }, { isDefault: false });
        }

        const address = await addressModel.create({
            user: req.user._id,
            fullName: String(fullName).trim(),
            contact: String(contact).trim(),
            streetAddress: String(streetAddress).trim(),
            city: String(city).trim(),
            state: String(state).trim(),
            pincode: String(pincode).trim(),
            landmark: landmark ? String(landmark).trim() : "",
            addressType: addressType || "Home",
            isDefault: shouldBeDefault
        });

        const addresses = await addressModel.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });

        return res.status(201).json({
            message: "Address saved successfully! ✨",
            success: true,
            address,
            addresses
        });
    } catch (err) {
        console.error("Add Address Error:", err);
        return res.status(500).json({
            message: err.message || "Failed to save address",
            success: false
        });
    }
};

export const getUserAddresses = async (req, res) => {
    try {
        const addresses = await addressModel.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
        return res.status(200).json({
            message: "Addresses fetched successfully",
            success: true,
            addresses
        });
    } catch (err) {
        console.error("Get Addresses Error:", err);
        return res.status(500).json({
            message: err.message || "Failed to fetch addresses",
            success: false
        });
    }
};

export const updateAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        const { fullName, contact, streetAddress, city, state, pincode, landmark, addressType, isDefault } = req.body;

        const address = await addressModel.findOne({ _id: addressId, user: req.user._id });
        if (!address) {
            return res.status(404).json({ message: "Address not found", success: false });
        }

        if (isDefault) {
            await addressModel.updateMany({ user: req.user._id }, { isDefault: false });
            address.isDefault = true;
        }

        if (fullName) address.fullName = String(fullName).trim();
        if (contact) address.contact = String(contact).trim();
        if (streetAddress) address.streetAddress = String(streetAddress).trim();
        if (city) address.city = String(city).trim();
        if (state) address.state = String(state).trim();
        if (pincode) address.pincode = String(pincode).trim();
        if (landmark !== undefined) address.landmark = String(landmark).trim();
        if (addressType) address.addressType = addressType;

        await address.save();

        const addresses = await addressModel.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });

        return res.status(200).json({
            message: "Address updated successfully",
            success: true,
            address,
            addresses
        });
    } catch (err) {
        console.error("Update Address Error:", err);
        return res.status(500).json({ message: err.message || "Failed to update address", success: false });
    }
};

export const deleteAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        await addressModel.findOneAndDelete({ _id: addressId, user: req.user._id });

        const addresses = await addressModel.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });

        return res.status(200).json({
            message: "Address deleted successfully",
            success: true,
            addresses
        });
    } catch (err) {
        console.error("Delete Address Error:", err);
        return res.status(500).json({ message: err.message || "Failed to delete address", success: false });
    }
};
