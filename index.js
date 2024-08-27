const express = require('express');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.json());

const filePath = path.join(__dirname, 'tasks.json');
const deleteFilePath = path.join(__dirname, 'deletedTasks.json');
const logFilePath = path.join(__dirname, 'operations.log');

// Load tasks from tasks.json
function loadTasks() {
    if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(fileContent);
    }
    return [];
}

// Save tasks to tasks.json
function saveTasks(tasks) {
    fs.writeFileSync(filePath, JSON.stringify(tasks, null, 2), 'utf-8');
}

// Load deleted tasks from deletedTasks.json
function loadDeletedTasks() {
    if (fs.existsSync(deleteFilePath)) {
        const fileContent = fs.readFileSync(deleteFilePath, 'utf-8');
        return JSON.parse(fileContent);
    }
    return [];
}

// Save deleted tasks to deletedTasks.json
function saveDeletedTasks(deletedTasks) {
    fs.writeFileSync(deleteFilePath, JSON.stringify(deletedTasks, null, 2), 'utf-8');
}

// Log operation details to operations.log
function logOperation(operationType, taskId) {
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp} - Operation: ${operationType}, Task ID: ${taskId}\n`;
    fs.appendFileSync(logFilePath, logEntry, 'utf-8');
}

let taskArray = loadTasks();

app.post('/addTask', (req, res) => {
    const task = req.body.task;

    if (!task) {
        return res.status(400).json({ error: 'Task is required' });
    }

    const newTask = {
        id: uuidv4(),
        task: task,
    };

    taskArray.push(newTask);
    saveTasks(taskArray); 
    logOperation('CREATE', newTask.id); // Log the create operation
    res.status(201).json(newTask);
});

app.get('/getTask/:id', (req, res) => {
    const taskId = req.params.id;
    const task = taskArray.find(task => task.id === taskId);
    if (!task) {
        return res.status(404).json({ error: 'Task not found' });
    }
    logOperation('READ', taskId); // Log the read operation
    res.json(task);
});

app.put('/updateTask/:id', (req, res) => {
    const taskId = req.params.id;
    const updatedTaskData = req.body;

    const taskIndex = taskArray.findIndex(task => task.id === taskId);

    if (taskIndex === -1) {
        return res.status(404).json({ error: 'Task not found' });
    }

    taskArray[taskIndex] = { ...taskArray[taskIndex], ...updatedTaskData };

    saveTasks(taskArray);
    logOperation('UPDATE', taskId); // Log the update operation
    res.status(200).json(taskArray[taskIndex]);
});

app.get("/", (req, res) => {
    res.json(taskArray);
});

// Delete a task by ID
app.delete('/deleteTask/:id', (req, res) => {
    const taskId = req.params.id;

    const taskIndex = taskArray.findIndex(task => task.id === taskId);

    if (taskIndex === -1) {
        return res.status(404).json({ error: 'Task not found' });
    }

    // Remove the task and get the deleted task data
    const [deletedTask] = taskArray.splice(taskIndex, 1);

    // Save the updated task array
    saveTasks(taskArray);

    // Optionally, add the deleted task to the deletedTasks.json file
    const deletedTasks = loadDeletedTasks();
    deletedTasks.push(deletedTask);
    saveDeletedTasks(deletedTasks);
    
    logOperation('DELETE', taskId); // Log the delete operation

    res.status(200).json({ message: 'Task deleted successfully', deletedTask });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
