const express = require('express');
const router = express.Router();
const fabricContracts = require('./fabricContracts')

const fabricContracts = new fabricContracts();


router.post("/enrollAdmin", (req,res) => {
    fabricContracts.enrollAdmin(req.body.adminName, req.body.password).then((results) => {
        res.send(results);
        return results;
    });
});

router.post("/RegisterUser", (req,res) => {
    fabricContracts.RegisterUser(req.body.adminName, req.body.username).then((results) => {
        res.send(results);
        return results;
    });
});

router.post("/registerSensor", (req,res) => {
    console.log(req.body.args)
    fabricContracts.registerSensor(req.body.username, req.body.channel, req.body.smartcontract, req.body.iot).then((results) => {
        res.send(results);
        return results;
    });
});

router.post("/IOTdataaddition", (req,res) => {
    fabricContracts.addTemptoContract(req.body.username, req.body.channel, req.body.smartcontract, req.body.iot).then((results) => {
        res.send(results);
        return results;
    });
});

router.post("/getData", (req,res) => {
    fabricContracts.getData(req.body.username, req.body.channel, req.body.smartcontract, req.body.iot).then((results) => {
        res.send(results);
        return results;
    });
});


module.exports = router;