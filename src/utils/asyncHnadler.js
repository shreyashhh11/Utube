const asyncHandler (reqhandler) => {
    (req, res, next ) => {
        Promise.resolve(reqhandler(req, res, next)).catch((err) => next(err))
    }
}

export { asyncHandler }

// steps how we got to 4th line
// const asyncHandler = () => {}

// const asyncHandler = (fun) => {}

// const asyncHandler = (fun) => {() => {}}


// MAKING A WRAPPER FUNTION USING TRY CATCH , ITS JUST FOR REFRENCE GONNA USE USING PROMISE 
// const asyncHandler = (fun) => async (req, res, next) => {
//     try {
        // await fun(req, res, next)
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success : false,
//             message : err.message
//         })
        
//     }
// }