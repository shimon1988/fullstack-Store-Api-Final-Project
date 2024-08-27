const express = require('express');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;


app.use(express.json());


const filePath = path.join(__dirname, 'tasks.json');


function loadTasks() {
    if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(fileContent);
    }
    return [];
}


function saveTasks(tasks) {
    fs.writeFileSync(filePath, JSON.stringify(tasks, null, 2), 'utf-8');
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
    res.status(201).json(newTask);
});

// get a task by id 
app.get('/getTask/:id', (req, res) => {
    const taskId = req.params.id;
    const task = taskArray.find(task => task.id === taskId);
    if (!task) {
        return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
})

app.get("/", (req, res) => {
    res.json(taskArray);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
