import { asyncHandler } from "../utils/asyncHnadler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import { log } from "console"

const generateAcessAndRefreshToken = async (userID) => {
    try {
        const user = await User.findById(userID)
        const accessToken = user.generateAcessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave : false})

        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "Error while generating access and refresh token")
    }
}

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

    const existedUser = await User.findOne({
        $or : [{ username },{ email }]
    })

    if(existedUser ){
        throw new ApiError(409,"user with this username or email already exists")
    }

    console.log(req.files);
    

    const avatarLoacalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

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

const loginUser = asyncHandler(async (req, res) => {
     // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie

    const {email,username,password} = req.body
    console.log(email);

    if(!username && !email) {
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or : [{username}, {email}]
    })
    
    if(!user){
        throw new ApiError(404, "user does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid) {
        throw new ApiError(401, "worng user credentials")
    }

    const {accessToken, refreshToken} = await generateAcessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user : loggedInUser, refreshToken, accessToken
            },
            "user logged in successfully "
        )
    )
})

    const logOutUser = asyncHandler (async (req, res) => {
        await User.findByIdAndDelete(
            req.user._id,
            {
                $set : {
                    refreshToken : undefined
                }
            },
            {
                new :  true
            }
        )

        const options = {
            httpOnly : true,
            secure : true
        }

        return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "user logged out"))
    })

    const refereshAccessToken = asyncHandler(async (req, res) => {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken 

        if(incomingRefreshToken) {
            throw new ApiError(401, "Unauthorized request ")
        }

        try {
            const decodedToken = jwt.verify(
                incomingRefreshToken,
                process.env.REFRESH_TOKEN_SECRET
            )
    
            const user =await User.findById(decodedToken?._id)
    
            if(!user) {
                throw new ApiError(401, "invalid refresh token ")
            }
    
            if(incomingRefreshToken !== user?.refreshToken){
                throw new ApiError(401, "refresh token is expired or used")
            }
    
            const options = {
                httpOnly : true,
                secure : true
            }
    
            const {accessToken, newRefreshToken} = await generateAcessAndRefreshToken(user_.id)
            
            return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                200,
                {accessToken, refreshToken : newRefreshToken},
                "access token refresh successfully"
            )
        } catch (error) {
            throw new ApiError(401, error?.message || "invalid refresh token")
        }
    })

export {
    registerUser,
    loginUser,
    logOutUser,
    refereshAccessToken,
}