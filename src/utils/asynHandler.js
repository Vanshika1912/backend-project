//making a wrapper db since we need to talk to it often.

const asyncHandler = (requestHandler) => {
    (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).
        catch((err) => next(err))
    }    //return statement
}



export{asyncHandler}

// const asyncHandler = () => {}
// const asyncHandler = () => ()=> {} higher order fn
// const asyncHandler = () => async() => {}

// const asyncHandler = (fn) => async(req, res, next) => {
//     try {
//         await(req, res, next)
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success: false,
//             message: err.message 
//         })
//     }
// }
