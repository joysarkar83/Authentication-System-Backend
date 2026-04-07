import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    email: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    otpHash: { type: String, required: true },
    tries: { type: Number, default: 0 }
},
    { timestamps: true }
);

const OTPModel = mongoose.model("OTP", otpSchema);

export default OTPModel;
