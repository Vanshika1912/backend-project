import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asynHandler.js";
import jwt  from 'jsonwebtoken';
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async( req, res, next) => {
    // Get token from header
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
    
        if (!token) {
            throw new ApiError(401, " Unauthorized request");
            
        }
        // Verify the token
        const decodeedToken = jwt.verify(token, process.env.ACECSS_TOKEN_SECRET)
    
        const user = await User.findById(decodeedToken?._id).select(" -password -refreshToken")
    
        if (!user) {
    
            throw ApiError(401 , "Invalid Token: User not found");
        }
    
        //we have the user
        req.user = user;
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access token");
    }
})