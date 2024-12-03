const mongoose = require("mongoose")

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Title is a required field"]
    },
    description: {
        type: String
    },
    isCompleted: {
        type: Boolean,
        default: false,
    },
    // taskCreationDate: {
    //     type: Date,
    //     default: Date.now
    // },
    // dueDate: {
    //     type: Date,
    //     required: [true, "dueDate is a required field"]
    // },
    createdBy: {
        type: mongoose.Schema.ObjectId
    },
    taskCreationDate: {
        type: String, // Store as a formatted string
        default: () => {
            const now = new Date();
            const mm = String(now.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
            const dd = String(now.getDate()).padStart(2, "0");
            const yyyy = now.getFullYear();
            return `${yyyy}-${mm}-${dd}`;
        },
    },
    dueDate: {
        type: String, // Store as a formatted string
    },
})

const Task = mongoose.model("Task", taskSchema)

module.exports = Task;