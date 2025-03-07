import { asyncHandler } from "../utils/asyncHnadler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import { log } from "console"
import { channel } from "diagnostics_channel"
import mongoose from "mongoose"

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
    
            if(!incomingRefreshToken !== user?.refreshToken){
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

    const changeCurrentPassword = asyncHandler(async(req, res) => {
        const {oldPassword, newPassword} = req.body

        const user = await User.findById(req.user?._id)

        const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
        if(!isPasswordCorrect) {
            throw new ApiError(400, " invalid old password")
        }

        user.password = newPassword
        await user.save({validateBeforeSave : false})

        return res
        .status(200)
        .json(new ApiResponse(200, {} , "password change successfully"))

    })

    const getCurrentUser = asyncHandler(async(req, res) =>{
        return res
        .status(200)
        .json(200, req.user, "current user fetched successfully")
    })

    const updateAccountDetails = asyncHandler(async(req, res) => {
        const {fullName, email} = req.body

        if(!fullName || !email) {
            throw new ApiError(400 , "all fields are required")
        }

        const user = User.findByIdAndUpdate(
            req.user?._id,
            {
                $set : {
                    fullName : fullName,
                    email : email
                }
            },
            {new : true}
        ).select("-password")

        return res
        .status(200)
        .json(new ApiResponse(200 , user, "account details updated successfully"))
    
    })

    const updateUserAvatar = asyncHandler(async(req, res) => {
        const avatarLoacalPath = req.file?.path

        if(!avatarLoacalPath){
            throw new ApiError(200, "need a avatar file to upload")
        }

        const avatar = await uploadOnCloudinary(avatarLoacalPath)

        if(!avatar.url){
            throw new ApiError(400, "missing avatar file url to upload")
        }

        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set :{
                    avatar : avatar.url
                }
            },
            {new : true}
        ).select("-password")

        return res
        .status(200)
        .json(
            new ApiResponse(200, user, "avatar image chnaged successfully ")
        )
    })

    const updateUserCoverImage = asyncHandler(async(req, res) => {
        const coverImageLoacalPath = req.file?.path

        if(!coverImageLoacalPath){
            throw new ApiError(200, "need a cover file to upload")
        }

        const coverImage = await uploadOnCloudinary(coverImageLoacalPath)

        if(!coverImage.url){
            throw new ApiError(400, "missing coverImage file url to upload")
        }

        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set :{
                    coverImage : coverImage.url
                }
            },
            {new : true}
        ).select("-password")

        return res
        .status(200)
        .json(
            new ApiResponse(200, user, "coverImage image chnaged successfully ")
        )
    })

    const getUserChannelProfile = asyncHandler(async(req, res) => {
        const {username} = req.params

        if(!username?.trim()) {
            throw new ApiError(400, "Username is missing")
        }

        const channel = await User.aggregate([
            {
                $match : {
                    username : username?.toLowerCase()
                }
            },
            {
                $lookup : {
                    from : "subscriptions",
                    localField : "_id",
                    foreignField : "channel",
                    as : "subscribers"
                }
            },
            {
                $lookup : {
                    from : "subscriptions",
                    localField : "_id",
                    foreignField : "subscriber",
                    as : "subscribedTo"
                }
            },
            {
                $addFields : {
                    subscribersCount : {
                        $size : "$subscribers"
                    },
                    channelSubscribedToCount : {
                        $size : "$subscribedTo"
                    },
                    isSubscribed : {
                        $cond  : {
                            if : {$in :[req.user?._id, "$subscribers.subscriber"]},
                            then : true ,
                            else : false
                        }
                    }
                }
            },
            {
                $project : {
                    fullName : 1,
                    email : 1,
                    username : 1,
                    avatar : 1,
                    coverImage : 1,
                    subscribersCount : 1,
                    channelSubscribedToCount : 1,
                    isSubscribed : 1

                }
            }   
        ])

        if(!channel?.length) {
            throw new ApiError(404, "channel does not exist")
        }
    
        return res 
        .status(200)
        .json(new ApiResponse(200 , channel[0], "user channel fetched successfully "))
    })

    

    const getWatchHistory = asyncHandler(async(req, res) => {
        const user = await User.aggregate ([
            {
                $match : {
                    _id : new mongoose.Types.ObjectId(req.user._id )
                }
            },
            {
                $lookup : {
                    from : "videos",
                    localField : "watchHistory",
                    foreignField : " _id",
                    as : "watchHistory",
                    pipeline : [
                        {
                            $lookup : {
                                from : "users",
                                localField : "owner",
                                foreignField : "_id",
                                as : "owner",
                                pipeline : [
                                    {
                                        $project : {
                                            fullName : 1,
                                            username : 1,
                                            avatar : 1 
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                }
            }
        ])

        return res
        .status(200 )
        .json (
            new ApiResponse (200, user[0].watchHistory, "watch histroy fetched successfully ")
        )
    })

export {
    registerUser,
    loginUser,
    logOutUser,
    refereshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory

}