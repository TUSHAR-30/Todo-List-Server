const Task = require('./../Models/taskModel');
const asyncErrorHandler = require('./../Utils/asyncErrorHandler');
const CustomError = require('./../Utils/CustomError');


exports.getAllTasks=asyncErrorHandler(async(req,res,next)=>{
    const tasks=await Task.find({createdBy:req.user._id})
    res.status(200).json({
        status:"success",
        count:tasks.length,
        userEmail:req.user.email,
        data:{
            tasks
        }
    })
})

exports.createTask=asyncErrorHandler(async(req,res,next)=>{
    const { title, description,dueDate } = req.body;
    const createdBy = req.user._id;
    const task = await Task.create({
      title,
      dueDate,
      createdBy,
      description
    });
    res.status(200).json({
      success: true,
      userEmail:req.user.email,
      data:{
        task
      }
    });
})

exports.deleteTask=asyncErrorHandler(async(req,res,next)=>{
    const task = await Task.findOneAndDelete({_id:req.params.id,createdBy:req.user._id});

    if(!task){
        const error = new CustomError('Task with that ID is not found!', 404);
        return next(error);
    }

    res.status(204).json({
        status: 'success',
        data: null
    });
})

exports.getTask=asyncErrorHandler(async(req,res,next)=>{
    console.log(req.params.id);
    console.log(req.user._id)
    const task = await Task.findOne({_id:req.params.id,createdBy:req.user._id});


    if(!task){
        const error = new CustomError('Task with that ID is not found!', 404);
        return next(error);
    }

    res.status(200).json({
        status: 'success',
        data: {
            task
        }
    });
})

exports.updateTask=asyncErrorHandler(async(req,res,next)=>{
    try{
        const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true});

        if(!updatedTask){
            const error = new CustomError('Task with that ID is not found!', 404);
            return next(error);
        }

        res.status(200).json({
            status: "success",
            data: {
                task: updatedTask
            }
        });
    }catch(err){
        res.status(404).json({
            status:"fail",
            message: err.message
        });
    }
})
