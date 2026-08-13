import app from "./src/app.js";
import { connectToDatabase } from "./src/config/db.js";

const port = process.env.PORT || 4000;

async function startServer() {
    try{
        await connectToDatabase();
        app.listen(port, () =>{
            console.log(`Server started on port ${port}`);
        });
    }catch(error){
        console.log('Failed to start the server:', error.message);
        process.exit(1);
    }
}
startServer();