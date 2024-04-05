import mongoose from "mongoose";
import { DB_NAME } from "../constants";


const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect
        (`${process.env.MONGO_URI}/${DB_NAME}`)
        console.log(`/n MongoDB is connected !! DB HOST: ${connectionInstance.connection.host} `); //use for knowing which host am I connecting
    } catch (error) {
        console.log("MONGODB connection error", error);
        process.exit(1)
    }
}

export default connectDB