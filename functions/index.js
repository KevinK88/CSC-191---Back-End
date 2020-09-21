const functions = require("firebase-functions");
const app = require("express")();
const FBAuth = require("./util/fbAuth");

var cors = require("cors");
app.use(cors());

const { db } = require("./util/admin");

const {
  getAllProjects,
  createProject,
  getProject,
  deleteProject,
  changeProjectName,
} = require("./handlers/projects");

const {
  createTask,
  deleteTask,
  editTaskDetails,
  getTask,
  createSubTask,
} = require("./handlers/tasks");

const { signup, login, getAuthenticatedUser } = require("./handlers/users");

// project routes
app.get("/projects", getAllProjects);
app.post("/project", FBAuth, createProject);
app.get("/project/:projectId", FBAuth, getProject);
app.delete("/project/:projectId", FBAuth, deleteProject);
app.post("/project/:projectId/edit", FBAuth, changeProjectName);

// task routes
app.post("/project/:projectId/task", FBAuth, createTask);
app.get("/project/:projectId/task/:taskId", FBAuth, getTask);
app.delete("/project/:projectId/task/:taskId", FBAuth, deleteTask);
app.post("/project/:projectId/task/:taskId/edit", FBAuth, editTaskDetails);
app.post("/project/:projectId/task/:taskId/subtask", FBAuth, createSubTask);

// users routes
app.post("/signup", signup);
app.post("/login", login);
app.get("/user", FBAuth, getAuthenticatedUser);

exports.api = functions.https.onRequest(app);

exports.onProjectDelete = functions.firestore
  .document("/projects/{projectId}")
  .onDelete((snapshot, context) => {
    const projectId = context.params.projectId;
    const batch = db.batch();
    return db
      .collection("tasks")
      .where("projectId", "==", projectId)
      .get()
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/tasks/${doc.id}`));
        });
        return batch.commit();
      })
      .catch((err) => {
        console.error(err);
      });
  });

exports.onTaskDelete = functions.firestore
  .document("/tasks/{taskId}")
  .onDelete((snapshot, context) => {
    const taskId = context.params.taskId;
    const batch = db.batch();
    return db
      .collection("tasks")
      .where("parentTaskId", "==", taskId)
      .get()
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/tasks/${doc.id}`));
        });
        return batch.commit();
      })
      .catch((err) => {
        console.error(err);
      });
  });
