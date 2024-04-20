//written an helper file in asynchandler as a wrapper
import { asyncHandler } from "../utils/asynHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from ".././models/user.model.js"
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from 'jsonwebtoken'

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ vaidateBeforeSave: false }) //saving in db 

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "something went wrong while generating the token")
    }
}
const registerUser = asyncHandler(async (req, res) => {
    //get user details from frontend
    const { fullName, email, username, password } = req.body
    console.log("email: ", email); //we can only data not files, hence we will use routes.
    // validation - not empty
    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, 'Please provide all fields!')

    }
    //check if user already exists: username, email
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiError(409, "user with email or usename already exists")
    }
    //check for images, check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required!");
    }
    //upload to cloudinary, 
    const avatar = await uploadOnCloudinary(avatarLocalPath, "image");
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar is required!");
    }
    //create user object - create entry in db
    const user = User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "", //corner case since it is not compulsory
        email,
        password,
        username: username.toLowerCase()
    })
    //check for user creation & remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken" //we do not want to send this info to the client side
    )
    if (!createdUser) {
        throw new ApiError(500, "");
    }
    //return response
    return res.status(200).json(
        new ApiResponse(200, createdUser, "User  has been registered successfully!")
    )

})
//login a user
const loginUser = asyncHandler(async (req, res) => {
    // req body -> data
    const { email, username, password } = req.body
    //username or email
    if (!username && !email) {
        throw new ApiError(400, "Username/Email or Password is required!")
    }
    //find the user
    const user = await User.findOne({
        $or: [{ username }, { email }] //using the operator by mongoDB
    })
    if (!user) {
        throw new ApiError(404, "user does not exist")
    }
    //password check - using bcrpyt
    const isPasswordValid = await user.isPasswordCorrect(password) //we are not using the Mongoose "User"
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials")
    }
    //access and refresh token 
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

    //things we want to sent to user(optional)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    // send cookie
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "Logged in successfully!"
            ) //implementing this if a user new to save something in local file.
        )

})
//logging out
const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
        .status(200)
        .clearCookie('accessToken', options)
        .clearCookie('refreshToken', options)
        .json(new ApiResponse(200, {}, "User loggedout successfully"))


})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request!")
    }
    //verifying the incomming token
   try {
     const decodedToken = jwt.verify(
         incomingRefreshToken,
         process.env.REFRESH_TOKEN_SECRET
     )
     const user = User.findById(decodedToken?._id)
     //payload is an optional thing, 
     if (!user) {
         throw new ApiError(401, "Invalid refresh token")
     }
     if(incomingRefreshToken !== user?.refreshToken) {
         throw new ApiError(401, "Refresh token as been expired or used")
     }
 
     const options = {
         hhttpOnly : true,
         secure: true
     }
     const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)
 
     return res
     .status(200)
     .cookie("accessToken", accessToken, options)
     .cookie("refreshToken", newRefreshToken, options)
     .json(
         new ApiResponse(
             200,
             {accessToken, refreshToken: newRefreshToken},
             "Access Token refreshed"
         )
        )
     } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    
   }
    
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken 

}

//we have created a method, so to run this method we to create routes.