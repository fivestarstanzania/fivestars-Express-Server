//JWT token generation utility

import jwt from "jsonwebtoken";

export const generateToken = (userId, res)=>{
    const token = jwt.sign({userId}, process.env.JWT_SECRET, {
        expiresIn: "1h",
    });
    //const accesstoken = sign({ userId: user._id, userEmail: user.email}, process.env.JWT_SECRET, { expiresIn: '15m' });

    res.cookie("jwt", token, {
        maxAge: 1*60*60*1000,
        httpOnly:true,
        sameSite:"strict",
        secure:process.env.NODE_ENV!="development",
    });

    return token
}