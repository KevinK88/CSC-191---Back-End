const { db } = require("../util/admin");

exports.createTask = (req, res) => {
  if (req.body.taskName.trim() === "")
    return res.status(400).json({ taskName: "must not be empty" });

  const newTask = {
    taskName: req.body.taskName,
    projectId: req.params.projectId,
    taskDescription: req.body.taskDescription,
    priority: req.body.priority,
    dueDate: req.body.dueDate,
    completed: req.body.completed,
    parentTaskId: "0",
    subTaskCount: 0,
  };

  db.doc(`/projects/${req.params.projectId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: "project not found" });
      }
      return db.collection("tasks").add(newTask);
    })
    .then((data) => {
      return res.json(newTask);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: "something went wrong" });
    });
};

// edit tasks
exports.editTaskDetails = (req, res) => {
  if (req.body.taskName.trim() == "")
    return res.status(400).json({ taskName: "cannot be empty" });

  const document = db
    .doc(`/tasks/${req.params.taskId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: "task not found" });
      }

      doc.ref.update({
        taskName: req.body.taskName,
        taskDescription: req.body.taskDescription,
        priority: req.body.priority,
        dueDate: req.body.dueDate,
        completed: req.body.completed,
      });
    })
    .then(() => {
      return res.status(203).json({ message: "Task details updated" });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

exports.getTask = (req, res) => {
  let taskData = {};
  db.doc(`/tasks/${req.params.taskId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        res.status(404).json({ error: "task not found" });
      }
      taskData = doc.data();
      taskData.taskId = doc.id;
      return db
        .collection("tasks")
        .orderBy("priority", "desc")
        .where("parentTaskId", "==", req.params.taskId)
        .get();
    })
    .then((data) => {
      taskData.subTasks = [];
      data.forEach((doc) => {
        taskData.subTasks.push({
          taskId: doc.id,
          projectId: doc.data().projectId,
          parentTaskId: doc.data().parentTaskId,
          taskName: doc.data().taskName,
          taskDescription: doc.data().taskDescription,
          priority: doc.data().priority,
          subTaskCount: doc.data().subTaskCount,
          completed: doc.data().completed,
          dueDate: doc.data().dueDate,
        });
      });
      return res.json(taskData);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

exports.deleteTask = (req, res) => {
  const document = db.doc(`/tasks/${req.params.taskId}`);
  var prntTaskId = "0";

  document
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: "task not found" });
      }
      if (doc.data().projectId !== req.params.projectId) {
        return req.status(403).json({ error: "unauthorized" });
      } else {
        prntTaskId = doc.data().parentTaskId;
        document.delete();
        db.doc(`/projects/${req.params.projectId}`)
          .get()
          .then((proj) => {
            if (!proj.exists) {
              return res.status(404).json({ error: "project not found" });
            }
          });
        if (prntTaskId !== "0") {
          db.doc(`/tasks/${prntTaskId}`)
            .get()
            .then((myTask) => {
              if (!myTask.exists) {
                return res.status(404).json({ error: "task not found" });
              }
              myTask.ref.update({
                subTaskCount: myTask.data().subTaskCount - 1,
              });
            });
        }
        return res.json({ message: "task deleted succesfully" });
      }
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

exports.createSubTask = (req, res) => {
  if (req.body.taskName.trim() === "")
    return res.status(400).json({ taskName: "must not be empty" });

  const newTask = {
    taskName: req.body.taskName,
    taskDescription: req.body.taskDescription,
    priority: req.body.priority,
    projectId: req.params.projectId,
    parentTaskId: req.params.taskId,
    dueDate: req.body.dueDate,
    completed: req.body.completed,
    subTaskCount: 0,
  };

  db.doc(`/tasks/${req.params.taskId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: "task not found" });
      }
      return doc.ref.update({ subTaskCount: doc.data().subTaskCount + 1 });
    })
    .then(() => {
      return db.collection("tasks").add(newTask);
    })
    .then((data) => {
      return res.json(newTask);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: "something went wrong" });
    });
};
