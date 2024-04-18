const mongoose = require("mongoose");
let UserDB = require("../model/model");

exports.create = (req, res) => {
  const user = new UserDB({
    active: "yes",
    status: "0",
  });

  user
    .save(user)
    .then((data) => {
      res.send(data._id);
    })
    .catch((error) => {
      res.status(500).send({
        message: err.message || "Some error occured while creating a new user.",
      });
    });
};

exports.leavingUserUpdate = (req, res) => {
  const userId = req.params.id;
  console.log("leaving userid:", userid);
  UserDB.updateOne(
    { _id: userId },
    {
      $set: {
        active: "no",
        status: "0",
      },
    }
  )
    .then((data) => {
      if (!data) {
        res
          .status(404)
          .send({ message: `Can not update user with user ID :${userId}` });
      } else {
        res.send("Document updated: User left");
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Error update user information.",
      });
    });
};

exports.newUserUpdate = (req, res) => {
  const userId = req.params.id;
  console.log("Revisited userid:", userid);

  UserDB.updateOne(
    { _id: userId },
    {
      $set: {
        active: "yes",
      },
    }
  )
    .then((data) => {
      if (!data) {
        res
          .status(404)
          .send({ message: `Can not update user with user ID :${userId}` });
      } else {
        res.send("Document updated: User left");
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Error update user information.",
      });
    });
};

exports.remoteUserFind = (req, res) => {
  const omeId = req.body.omeId;

  UserDB.aggregate([
    {
      $match: {
        _id: { $ne: new mongoose.Types.ObjectId(omeId) },
        active: "yes",
        status: "0",
      },
    },
    {
      $sample: {
        size: 1,
      },
    },
  ])
    .limit(1)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        messsgae:
          err.message || "Error occured while retriving user information.",
      });
    });
};

exports.getNextUser = (req, res) => {
  const omeID = req.body.omeID;
  const remoteUser = req.body.remoteUser;

  const excludedIds = [omeID,remoteUser];
  UserDB.aggregate([
    {
      $match: {
        _id: { $nin:excludedIds.map(id=>{new mongoose.Types.ObjectId(id)})  },
        active: "yes",
        status: "0",
      },
    },
    {
      $sample: {
        size: 1,
      },
    },
  ])
    .limit(1)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        messsgae:
          err.message || "Error occured while retriving user information.",
      });
    });
};


exports.updateOnEngagement = (req, res) => {
  const userId = req.params.id;
  console.log("Updated userid:", userid);

  UserDB.updateOne(
    { _id: userId },
    {
      $set: {
        status: "1",
      },
    }
  )
    .then((data) => {
      if (!data) {
        res
          .status(404)
          .send({ message: `Can not update user with user ID :${userId}` });
      } else {
        res.send("Document updated: User left");
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Error update user information.",
      });
    });
};
