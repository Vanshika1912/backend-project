//written an helper file in asynchandler as a wrapper
import { asyncHandler } from "../utils/asynHandler.js";

const registerUser = asyncHandler( async (req, res) => {
    res.status(200).json({
        message: "ok"
    })
})

export { registerUser }

//we have created a method, so to run this method we to create routes.