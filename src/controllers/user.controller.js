import { asyncHandler } from "../utils/asyncHnadler.js"

const registerUser = asyncHandler( async (req, res) => {
    res.status(200).json({
        message : "okay"
    })
})

export {registerUser}