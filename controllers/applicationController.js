const Application = require('../models/application');
const User = require('../models/user');
const OpenAI = require('openai');


// const createApplication = async (req, res) => {
//   try {
//     console.log("Request body:", req.body);
//     const { title, description, approverPath } = req.body;
//     const creatorId = req.user.id; 
//     const newApplication = new Application({
//       title,
//       description,
//       approverPath,
//       creatorId,
//       currentApproverIndex: 0,
//     });
//     await newApplication.save();
//     res.status(201).json({ success: true, applicationId: newApplication._id });
//   } catch (err) {
//     console.error("Error creating application:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };



// const createApplication = async (req, res) => {
//   try {
//     console.log("Request body:", req.body);

//     const { title, description, approverPath } = req.body;

//     if (!req.user || !req.user.id) {
//       return res.status(401).json({ success: false, message: 'Unauthorized' });
//     }

//     const creatorId = req.user.id;

//     const newApplication = new Application({
//       title,
//       description,
//       approverPath,
//       creatorId,
//       currentApproverIndex: 0,
//     });

//     await newApplication.save();

//     res.status(201).json({ success: true, applicationId: newApplication._id });
//   } catch (err) {
//     console.error("Error creating application:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

const createApplication = async (req, res) => {
  try {
    const { title, description, approverPath } = req.body;

    const creatorId = req.user.id;

    // Create the statusMap using the approverPath
    const statusMap = new Map();
    approverPath.forEach(approver => {
      statusMap.set(approver, 'pending');
    });

    const newApplication = new Application({
      title,
      description,
      approverPath,
      statusMap, 
      creatorId,
      currentApproverIndex: 0,
    });

    await newApplication.save();

    res.status(201).json({ success: true, applicationId: newApplication._id });
  } catch (err) {
    console.error("Error creating application:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};




const getApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.applicationId);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    res.json(application);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const editApplication = async (req, res) => {
  try {
    const { title, description, approverPath } = req.body;
    const application = await Application.findById(req.params.applicationId);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    if (application.creatorId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    application.title = title || application.title;
    application.description = description || application.description;
    application.approverPath = approverPath || application.approverPath;
    await application.save();
    res.json({ success: true, application });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.applicationId);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    await Application.deleteOne({ _id: req.params.applicationId });
    res.json({ success: true, message: 'Application removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getAllApplications = async (req, res) => {
  try {
    const applications = await Application.find({ creatorId: req.params.userId });
    res.json(applications);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAllApplicationsForApprover = async (req, res) => {
  const { userId } = req.params;

    const applications = await Application.find({
      $expr: {
        $or: [
          { $eq: [ { $arrayElemAt: ["$approverPath", "$currentApproverIndex"] }, { $toObjectId: userId } ] },
          { $lt: [ { $indexOfArray: ["$approverPath", { $toObjectId: userId }] }, "$currentApproverIndex" ] }
        ]
      }
    });

    res.status(200).json(applications);

};

const approveApplication = async (req, res) => {
    const application = await Application.findById(req.params.applicationId);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    const approver = req.user.id;
    if (application.approverPath[application.currentApproverIndex].toString() !== approver) {
      return res.status(403).json({ success: false, message: 'Not authorized to approve' });
    }
    application.currentApproverIndex++;
    if (application.currentApproverIndex >= application.approverPath.length) {
      application.status = 'approved';      
    }   

    application.statusMap.set(approver.toString(), 'approved');

    await application.save();
    res.json({ success: true, application });
    
};

const rejectApplication = async (req, res) => {
    const application = await Application.findById(req.params.applicationId);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    const approver = req.user.id;
    if (application.approverPath[application.currentApproverIndex].toString() !== approver) {
      return res.status(403).json({ success: false, message: 'Not authorized to reject' });
    }
    application.status = 'rejected';
    application.statusMap.set(approver.toString(), 'rejected');

    await application.save();
    res.json({ success: true, application });
};

const getApplicationStatus = async (req, res) => {
  try {
    const application = await Application.findById(req.params.applicationId);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    res.json({ status: application.status });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const setrejectmessage = async (req, res) => {

  try {
    const application = await Application.findById(req.params.applicationId);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    const rejectMessage = req.body.rejectMessage;
    application.rejectMessage = rejectMessage;
    await application.save();
    res.json({ success: true, message: "reject message set" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }


};

//new
const getApproversWithStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const application = await Application.findById(applicationId);

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const approverDetails = await Promise.all(application.approverPath.map(async (approverId, index) => {

        const user = await User.findById(approverId);
        if (!user) {
          return `Approver ${index + 1}: Not found, Status: ${application.statusMap.get(approverId.toString()) || 'Unknown'}`;
        }
        return ` ${index + 1}. ${user.username} Status: ${application.statusMap.get(approverId.toString()) || 'Unknown'}`;

    }));
    

    res.status(200).json({ success: true, approvers: approverDetails });
  } catch (error) {
    console.error('Error fetching approvers with status:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


module.exports = {
  createApplication,
  getApplication,
  editApplication,
  deleteApplication,
  getAllApplications,
  getAllApplicationsForApprover,
  approveApplication,
  rejectApplication,
  getApplicationStatus,
  getApproversWithStatus,
  setrejectmessage
};
