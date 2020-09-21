const { db } = require("../util/admin");

// get all projects
exports.getAllProjects = (req, res) => {
  db.collection("projects")
    .orderBy("dateCreated", "desc")
    .get()
    .then((data) => {
      let projects = [];
      data.forEach((doc) => {
        projects.push({
          projectId: doc.id,
          projectName: doc.data().projectName,
          email: doc.data().email,
          dateCreated: doc.data().dateCreated,
        });
      });
      return res.json(projects);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

// create new project
exports.createProject = (req, res) => {
  if (req.body.projectName.trim() === "") {
    return res
      .status(400)
      .json({ projectName: "Project name must not be empty" });
  }

  const newProject = {
    projectName: req.body.projectName,
    email: req.user.email,
    dateCreated: new Date().toISOString(),
  };

  db.collection("projects")
    .add(newProject)
    .then((doc) => {
      const resProject = newProject;
      newProject.projectId = doc.id;
      res.json(newProject);
    })
    .catch((err) => {
      res.status(500).json({ error: "something went wrong" });
      console.error(err);
    });
};

// get one project
exports.getProject = (req, res) => {
  let projectData = {};
  db.doc(`/projects/${req.params.projectId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        res.status(404).json({ error: "project not found" });
      }
      projectData = doc.data();
      projectData.projectId = doc.id;
      return db
        .collection("tasks")
        .where("parentTaskId", "==", "0")
        .where("projectId", "==", req.params.projectId)
        .orderBy("priority", "desc")
        .get();
    })
    .then((data) => {
      projectData.tasks = [];
      data.forEach((doc) => {
        projectData.tasks.push({
          taskId: doc.id,
          projectId: doc.data().projectId,
          parentTaskId: doc.data().parentTaskId,
          taskName: doc.data().taskName,
          taskDescription: doc.data().taskDescription,
          priority: doc.data().priority,
          subTaskCount: doc.data().subTaskCount,
          completedSubTasks: doc.data().completedSubTasks,
          completed: doc.data().completed,
          dateCreated: doc.data().dateCreated,
          dueDate: doc.data().dueDate,
          dateCompleted: doc.data().dateCompleted,
        });
      });
      return res.json(projectData);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

// Delete a Project
exports.deleteProject = (req, res) => {
  const document = db.doc(`/projects/${req.params.projectId}`);
  document
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: "project not found" });
      }
      if (doc.data().email !== req.user.email) {
        return res.status(403).json({ error: "unauthorized" });
      } else {
        document.delete();
      }
    })
    .then(() => {
      res.json({ message: "Project deleted succesfully" });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

// change project name
exports.changeProjectName = (req, res) => {
  if (req.body.projectName.trim() == "")
    return res.status(400).json({ projectName: "cannot be empty" });

  const document = db
    .doc(`/projects/${req.params.projectId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: "project not found" });
      }
      return doc.ref.update({ projectName: req.body.projectName });
    })
    .then((data) => {
      return res.status(203).json({ message: "Project name updated" });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};
