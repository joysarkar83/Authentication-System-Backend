import User from "../models/user.model.js";
import crypto, { verify } from "crypto";
import config from "../configs/config.js";
import jwt from "jsonwebtoken";
import Session from "../models/session.model.js";
import { sendEmail } from "../services/email.service.js";
import { generateOTP, generateOTP_HTML } from "../utils/util.OTP.js";
import OTPModel from "../models/otp.model.js";

export async function register(req, res) {
    const { username, email, password } = req.body;

    const isAlreadyRegistered = await User.findOne({ $or: [{ username }, { email }] });

    if (isAlreadyRegistered) {
        res.status(409).json({ message: "Username or email already exists" });
        return;
    }

    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

    const user = await User.create({ username, email, password: hashedPassword });

    const otp = generateOTP();
    const otpHtml = generateOTP_HTML(otp);
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    await OTPModel.create({ email, user: user._id, otpHash });

    await sendEmail(email, "Your OTP for Email Verification", `Your OTP is: ${otp}`, otpHtml);

    res.status(201).json({
        message: "User registered successfully",
        user: {
            username: user.username,
            email: user.email,
            verified: user.verified
        }
    });
}

export async function login(req, res) {
    const { username, email, password } = req.body;

    const user = await User.findOne({ $or: [{ username }, { email }] });

    if (!user) {
        return res.status(401).json({ message: "Invalid username or email" });
    }

    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

    if (user.password !== hashedPassword) {
        return res.status(401).json({ message: "Invalid password" });
    }

    if(!user.verified) {
        return res.status(403).json({ message: "Email not verified. Please verify your email before logging in." });
    }

    const refreshToken = jwt.sign({ id: user._id }, config.JWT_SECRET, { expiresIn: "7d" });

    const session = await Session.create({
        user: user._id,
        refreshTokenHash: crypto.createHash('sha256').update(refreshToken).digest('hex'),
        ip: req.ip,
        userAgent: req.headers['user-agent']
    });

    const accessToken = jwt.sign({ id: user._id, sessionId: session._id }, config.JWT_SECRET, { expiresIn: "15m" });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
        message: "Login successful",
        user: {
            username: user.username,
            email: user.email
        },
        accessToken
    });
}

export async function getMe(req, res) {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const session = await Session.findOne({ refreshTokenHash, revoked: false });
    if (!session) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(session.user);
    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    res.status(200).json({
        username: user.username,
        email: user.email
    });
}

export async function refreshToken(req, res) {
    const hashedRefreshToken = req.cookies.refreshToken;

    if (!hashedRefreshToken) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const refreshToken = jwt.verify(hashedRefreshToken, config.JWT_SECRET);

    const session = await Session.findOne({ hashedRefreshToken, revoked: false });
    if (!session) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(refreshToken.id);
    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const newAccessToken = jwt.sign({ id: user._id }, config.JWT_SECRET, { expiresIn: "15m" });
    const newRefreshToken = jwt.sign({ id: user._id }, config.JWT_SECRET, { expiresIn: "7d" });

    const newRefreshTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
    session.refreshTokenHash = newRefreshTokenHash;
    await session.save(); (refreshToken.id);
    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
        accessToken: newAccessToken,
        message: "Access token refreshed successfully"
    });
}

export async function logoutAll(req, res) {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(400).json({ message: "Refresh token is required" });
    }

    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const session = await Session.findOne({ refreshTokenHash });
    if (!session) {
        return res.status(400).json({ message: "Invalid refresh token" });
    }

    await Session.updateMany({ user: session.user }, { revoked: true });

    res.clearCookie('refreshToken');

    res.status(200).json({ message: "Logged out successfully" });
}

export async function logout(req, res) {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(400).json({ message: "Refresh token is required" });
    }

    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const session = await Session.findOne({ refreshTokenHash, revoked: false });
    if (!session) {
        return res.status(400).json({ message: "Invalid refresh token" });
    }
    session.revoked = true;
    await session.save();
    res.clearCookie('refreshToken');

    res.status(200).json({ message: "Logged out successfully" });
}

export async function verifyEmail(req, res) {
    const { otp, email } = req.body;

    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    const otpRecord = await OTPModel.findOne({ email });

    if (otpRecord.otpHash !== otpHash) {
        otpRecord.tries += 1;
        await otpRecord.save();

        if (otpRecord.tries >= 3) {
            await OTPModel.deleteMany({ email });
            return res.status(400).json({ message: "Invalid OTP" });
        }

        return res.status(400).json({ message: "Invalid OTP" });
    }

    const user = await User.findById(otpRecord.user);
    if (!user) {
        return res.status(400).json({ message: "User not found" });
    }

    user.verified = true;
    await user.save();

    await OTPModel.deleteMany({ email });

    res.status(200).json({ message: "Email verified successfully" });
}