// database 
const {Period} = require('../models');

// create period 
exports.createPeriod = async (req,res) => {
    try {
        const {start_time , end_time} = req.body;

        const [startHour, startMinute] = start_time.split(":").map(Number)
        const [endHour, endMinute] = end_time.split(":").map(Number)

        const startTotalMinutes = startHour * 60 + startMinute;
        const endTotalMinutes = endHour * 60 + endMinute;

        if (endTotalMinutes <= startTotalMinutes) {
            return res.status(400).json({
                message: "End time must be greater than start time."
            });
        }
        const period = await Period.create(req.body);
        res.status(201).json({
            message: "Period created successfully",
            data : period
        })
    } catch (error) {
        res.status(500).json({
            message :"Can't Create Period" 
        })
        console.log(error)
    }
}

// fetch all period 
exports.getAllPeriod = async (req,res) => {
    try {
        const periods = await Period.findAll(); 
        res.status(201).json({
            data : periods
        })
    } catch (error) {
        res.status(500).json({
            message :"Can't fetch" 
        })
        console.log(error)
    }
}

// get period 
exports.getPeriod = async(req, res) => {
    try {
        const period = await Period.findByPk(req.params.id);
        res.status(201).json({
            data : period
        })
    } catch (error) {
        res.status(500).json({
            message :"Can't fetch" 
        })
        console.log(error)
    }
}

// update period 
exports.updatePeriod = async(req,res) => {
    try {
        const period = await Period.findByPkAndUpdate(req.params.id , req.body , {
            new : true , 
            runValidators : true
        })
        res.status(201).json({
            data : period
        })
    } catch (error) {
        res.status(500).json({
            message :"Can't update" 
        })
        console.log(error)
    }
}

exports.deletePeriod = async (req, res) => {
    try {
        const periodId = req.params.id;
        // Validate the ID
        if (!periodId) {
            return res.status(400).json({ message: "ID is required" });
        }
        // Delete the period by the correct primary key name
        const deletedCount = await Period.destroy({
            where: { period_id: periodId },
        });

        if (deletedCount === 0) {
            return res.status(404).json({ message: "Period not found" });
        }

        res.status(204).json(); 
    } catch (error) {
        console.error(error); 
        res.status(500).json({ message: "Can't delete" });
    }
};
exports.updatePeriod = async (req, res) => {
    try {
        const {start_time , end_time} = req.body;

        const [startHour, startMinute] = start_time.split(":").map(Number)
        const [endHour, endMinute] = end_time.split(":").map(Number)

        const startTotalMinutes = startHour * 60 + startMinute;
        const endTotalMinutes = endHour * 60 + endMinute;

        if (endTotalMinutes <= startTotalMinutes) {
            return res.status(400).json({
                message: "End time must be greater than start time."
            });
        }
        
        const periodId = req.params.id;
        // Validate the ID
        if (!periodId) {
            return res.status(400).json({ message: "ID is required" });
        }
        // Update the period by the correct primary key name
        const updatedCount = await Period.update(req.body, {
            where: { period_id: periodId },
        }); 
        if (updatedCount === 0) {
            return res.status(404).json({ message: "Period not found" });
        }
        res.status(204).json();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Can't update" });
    }
}