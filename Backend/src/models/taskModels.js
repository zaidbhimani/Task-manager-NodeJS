let tasks = [
    { id: 1, title: "Learn Express", completed: false },
    { id: 2, title: "Practice JavaScript", completed: true },
    { id: 3, title: "Learn PostgreSQL", completed: false },
];

export const getAllTasks = () => {
    return tasks;
};

export const addNewTask = (newTask) => {
    const taskObj = {
        id: tasks.length + 1,
        completed: false,
        title: newTask
    }
    tasks.push(taskObj);
    return tasks;
}


export const updateTask = (newTask) => {
   const updatedTask = tasks.map((ele,idx)=>{
        if(ele.id === newTask.id){
            return {
                ...ele,
                title:newTask.title
            }
        }   
        return ele
   })
   tasks = updatedTask;
    return updatedTask;
}