import { asyncHandler } from "../utils/asyncHnadler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const registerUser = asyncHandler( async (req, res) => {

    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    
    const {fullName, email, username , password} = req.body
    console.log("email : ", email);

    if(
        [fullName, email, username, password].some((field) => field.trim() === "") 
    ){
        throw new ApiError(400,"All fields are required");    
    }

    const existedUser = User.findOne({
        $or : [{ username },{ email }]
    })

    if(existedUser ){
        throw new ApiError(409,"user with this username or email already exists")
    }

    const avatarLoacalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLoacalPath) {
        throw new ApiError(400,"Avatar is needed")
    }

    const avatar = await uploadOnCloudinary(avatarLoacalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar) {
        throw new ApiError(400,"Avatar is needed")
    }

    const user = await User.create({
        fullName,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase(),
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken "
    )

    if(!createdUser) {
        throw new ApiError(500, "something went wrong while registring")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "new user created successfully")
    )

})

export {registerUser}