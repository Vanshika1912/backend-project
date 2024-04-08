//written an helper file in asynchandler as a wrapper
import { asyncHandler } from "../utils/asynHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from ".././models/UserModel.js"
import { uploadOnCloudinary } from '../cloudinary/uploadToClodinary.js'
import { ApiResponse } from "../utils/ApiResponse.js";

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
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

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
        coverImage:coverImage?.url || "", //corner case since it is not compulsory
        email,
        password,
        username:username.toLowerCase()
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

export { registerUser }

//we have created a method, so to run this method we to create routes.