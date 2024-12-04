//IMPORT PACKAGE
const express = require('express');
const morgan = require('morgan');
const cookieParser=require("cookie-parser");
const cors=require("cors")
const authRouter = require('./Routes/authRouter')
const userRouter=require("./Routes/userRoutes")
const taskRouter=require("./Routes/taskRoutes")
const CustomError = require('./Utils/CustomError');
const globalErrorHandler = require('./Controllers/errorController')

let app = express();

app.use(
    cors({
      // origin: ["http://localhost:5173"],
      origin: ["https://tushar-30.github.io/Todo-List/"],
      methods: ["GET", "PUT", "DELETE", "POST","PATCH"],
      credentials: true,
    })
  );

app.use(cookieParser());  
app.use(express.json());
app.use(express.static('./public'))

if(process.env.NODE_ENV=='development'){
    app.use(morgan("dev"));
}

//USING ROUTES
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/user', userRouter);
app.use('/api/v1/tasks',taskRouter);


app.all('*', (req, res, next) => {
    const err = new CustomError(`Can't find ${req.originalUrl} on the server!`, 404);
    next(err);
});

app.use(globalErrorHandler);

module.exports = app;



