import mongoose, { Schema } from "mongoose";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken'

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true, //for searching field enable it
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        avatar: {
            type: String, //cloudinary url
            required: true
        },
        coverImage: {
            type: String, //cloudinary url
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"  //reference to the Video model
            }
        ],
        password: {
            type: string,
            required: [true, 'Password is required']
        },
        referenceToken: {
            type: String,   //token for resetting password
        }
    },
    {
        timestamps: true //It will add createdAt and updatedAt as fields in our schema by default.
    }
)
userSchema.pre("save", async function (next) {
    if (!this.isModified("password"))
        return next();
    this.password = bcrypt.hash(this.password, 10);//encrypting the user's password before saving it into database using bcrypt 
})
//comparing the string password with our encrypted password
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}
//use of token to secure the system
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this.email,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACECSS_TOKEN_SECRET,{
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY //whenerver this is generator it return a token too.
        }
    )
}

userSchema.methods.generateRefreshToken = function () {
    jwt.sign(
        {
            _id:this.id
        },
        process.env.REFRESH_TOKEN_SECRET,{
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY //whenerver this is generator it return a token too.
        }
    )
 }


export const User = mongoose.model("User", userSchema);