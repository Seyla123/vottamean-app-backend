const Period = require('../models/periodModel');

// create period 
exports.createPeriod = asynce (req,res) => {
    try {
        const period = await Period.create(req.body);
        res.status(201),json({
            message: "Period created successfully",
            data : period
        })
    } catch (error) {
        console.log(error)
    }
}

// fetch all period 
exports.getAllPeriod = async (req,res) => {
    try {
        const periods = await Period.find(); 
        res.status(201).json({
            data : periods
        })
    } catch (error) {
        console.log(error)
    }
}

// get period 
exports.getPeriod = async(req, res) => {
    try {
        const period = await Period.findById(req.params.id);
        res.status(201).json({
            data : period
        })
    } catch (error) {
        console.log(error)
    }
}

// update period 
exports.updatePeriod = async(req,res) => {
    try {
        const period = await Period.findByIdAndUpdate(req.params.id , req.body , {
            new : true , 
            runValidators : true
        })
        res.status(201).json({
            data : period
        })
    } catch (error) {
        console.log(error)
    }
}

// delete period 
exports.deletePeriod = async(req, res) => {
    try {
        const period = await Period.findByIdAndDelete(req.params.id); 
        res.status(201).json({
            data : period
        })
    } catch (error) {
        console.log(error)
    }
}