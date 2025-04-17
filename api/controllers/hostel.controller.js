import axios from "axios";
import { HostelLeave, HostelTransfer } from "../models/hostel.model.js";
import { Student } from '../models/student.model.js';
import { MealPlanRequest, MealSubscription } from "../models/meals.model.js";
import mongoose from "mongoose";

export const studentLeave = async (req, res) => {
  try {
    const { studentId, startDate, endDate, applicationId, email, reason } = req.body;
    console.log(req.body);
    // Validate input
    if (!studentId || !startDate || !endDate) {
      return res.status(400).json({ message: "All fields are required" });
    }

    
    // const startDate = new Date(leaveStartDate);
    // const endDate = new Date(leaveEndDate);

    // Validate dates
    if (startDate >= endDate) {
        return res.status(400).json({ message: "End date must be after start date" });
    }
    if (startDate < new Date()) {
        return res.status(400).json({ message: "Start date cannot be in the past" });
    }


    const student = await Student.findOne({ email });
    if (!student) {
        return res.status(404).json({ message: "Student not found" });
    }
    if (student.rollNo !== studentId) {
        return res.status(400).json({ message: "Student ID does not match email" });
    }
    // Create leave request object
    const leaveRequest = {
        rollNo: student.rollNo,
        // applicationId,
        startDate,
        endDate,
        reason,
        status: 'Pending',
    };

    // Save to database (assuming you have a LeaveRequest model)
    await HostelLeave.create(leaveRequest);
    console.log(leaveRequest);
    // For example, save the leave request to the database

    res.status(200).json({ message: "Leave request submitted successfully" });
  } catch (error) {
    console.error("Error in studentLeave:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export const getStudentLeave = async (req, res) => {
    try {
      const student = await Student.findOne({userId: req.params.id});
  
      if (!student) {
        console.error("Student not found:", req.params.id);
        return res.status(404).json({ message: "Student not found" });
      }
  
      const leaves = await HostelLeave.find({ rollNo: student.rollNo });
  
      if (!leaves || leaves.length === 0) {
        return res.status(404).json({ message: "No leaves found for this student" });
      }
  
      res.status(200).json(leaves);
    } catch (error) {
      console.error("Error in getStudentLeave:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

export const getAllLeaves = async (req, res) => {
    try {
        const leaves = await HostelLeave.find({});

        if (!leaves || leaves.length === 0) {
            return res.status(404).json({ message: "No leaves found" });
        }
        res.status(200).json(leaves);
    } catch (error) {
        console.error("Error in getAllLeaves:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const updateAnyLeave = async (req, res) => {
    try {
        const { status } = req.body;
        const leaveId = req.params.id;

        const leave = await HostelLeave.findByIdAndUpdate(leaveId, { status }, { new: true });

        if (!leave) {
            return res.status(404).json({ message: "Leave request not found" });
        }

        res.status(200).json({ message: "Leave request updated successfully", leave });
    } catch (error) {
        console.error("Error in updateAnyLeave:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const hostelTransfer = async (req, res) => {
  try {
    const { status, studentId, currentHostel, requestedHostel, reason } = req.body;
    console.log(req);

    // Validate input
    if (!studentId || !currentHostel || !requestedHostel || !reason) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const student = await Student.findOne({ rollNo: studentId });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Create transfer request object
    const transferRequest = {
      rollNo: student.rollNo,
      currentHostel,
      requestedHostel,
      reason,
      status
    };

    // Save to database
    await HostelTransfer.create(transferRequest);

    res.status(200).json({ message: "Transfer request submitted successfully" });
  } catch (error) {
    console.error("Error in createTransferRequest:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getStudentTransfer = async (req, res) => {
  try {
    const student = await Student.findOne({userId: req.params.id});
    

    if (!student) {
      console.error("Student not found:", id);
      return res.status(404).json({ message: "Student not found" });
    }

    const requests = await HostelTransfer.find({ rollNo: student.rollNo });
    if (!requests) {
      return res.status(404).json({ message: "No requests found for this student" });
    }

    res.status(200).json(requests);
  } catch (error) {
    console.error("Error in getStudentTransfer:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all transfer requests
export const getAllTransferRequests = async (req, res) => {
  try {
    const requests = await HostelTransfer.find({});
    res.status(200).json(requests);
  } catch (error) {
    console.error("Error in getAllTransferRequests:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Approve or reject a transfer request
export const updateTransferRequest = async (req, res) => {
  try {
    const { status, reason, newHostel, rollNo } = req.body;
    const requestId = req.params.id;

    // console.log(requestId, status, reason, newHostel, rollNo);

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Make a GET request to fetch the userId using the rollNo
    let userId;
    try {
      const response = await axios.get(`http://localhost:8000/api/student/${rollNo}/rollno`);
      if (response.status === 200) {
        userId = response.data.userId;
      } else {
        return res.status(404).json({ message: 'Student not found' });
      }
    } catch (error) {
      console.error("Error fetching userId by rollNo:", error);
      return res.status(500).json({ message: "Failed to fetch userId" });
    }

    // console.log(userId);

    if (status === 'Approved') {
      try {
        // Make a PUT request to update the student's profile
        const response = await axios.put(`http://localhost:8000/api/student/${userId}/profile`, {
          hostel: newHostel
        });

        if (response.status !== 200) {
          throw new Error('Failed to update student profile');
        }
      } catch (error) {
        console.error("Error in updating hostel:", error);
        return res.status(500).json({ message: "Failed to update hostel, transaction aborted" });
      }
    }
    // console.log("Hostel changed");

    // Update the transfer request status and reason
    const request = await HostelTransfer.findByIdAndUpdate(
      requestId,
      { status, reason },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ message: "Transfer request not found" });
    }

    res.status(200).json({ message: "Transfer request updated successfully", request });
  } catch (error) {
    console.error("Error in updateTransferRequest:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


//MESS CONTROLLERS

export const getStudentSubscriptionInfo = async (req, res) => {
    try {
     
      if (!req.student) {
        return res.status(404).json({ message: "Student record not found" });
      }
  
      const subscription = await MealSubscription.findOne({ studentId: req.student._id }).lean();
  
    
      const pendingRequest = await MealPlanRequest.findOne({
        studentId: req.student._id,
        status: 'Pending'
      }).lean();
  
     
      const currentSubscription = subscription || {
        currentPlan: 'None',
        isActive: false,
        studentId: req.student._id,
        rollNo: req.student.rollNo
      };
  
      res.status(200).json({
        subscription: currentSubscription,
        pendingRequest: pendingRequest || null
      });
    } catch (error) {
      console.error("Error fetching student subscription info:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
  
  export const createMealPlanRequest = async (req, res) => {
    try {
    
      if (!req.student) {
        return res.status(404).json({ message: "Student record not found" });
      }
  
      const { newPlan } = req.body;
  
      if (!newPlan) {
        return res.status(400).json({ message: 'New meal plan is required' });
      }
  
      const validPlans = ['None', 'Basic', 'Premium', 'Unlimited'];
      if (!validPlans.includes(newPlan)) {
        return res.status(400).json({ message: `Invalid meal plan requested. Valid plans are: ${validPlans.join(', ')}` });
      }
  
      const subscription = await MealSubscription.findOne({ studentId: req.student._id }).lean();
      const currentPlan = subscription ? subscription.currentPlan : 'None';
  
      if (currentPlan === newPlan) {
        return res.status(400).json({
          message: `Your current meal plan is already '${currentPlan}'. You cannot request the same plan again.`
        });
      }
  
      const existingPending = await MealPlanRequest.findOne({ 
        studentId: req.student._id, 
        status: 'Pending' 
      });
      
      if (existingPending) {
        return res.status(400).json({ message: 'You already have a pending meal plan change request.' });
      }
  
      const request = new MealPlanRequest({
        studentId: req.student._id,
        rollNo: req.student.rollNo,
        currentPlan: currentPlan,
        newPlan: newPlan,
        status: 'Pending',
      });
  
      await request.save();
  
      res.status(201).json({
        message: 'Subscription request submitted successfully.',
        requestDetails: request
      });
  
    } catch (error) {
      console.error("Error creating meal plan request:", error);
      if (error.name === 'ValidationError') {
        return res.status(400).json({ message: "Validation Error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  };
  
  export const getStudentMealRequestHistory = async (req, res) => {
    try {
     
      if (!req.student) {
        return res.status(404).json({ message: "Student record not found" });
      }
  
     
      const history = await MealPlanRequest.find({ studentId: req.student._id })
        .sort({ createdAt: -1 })
        .lean();
  
      res.status(200).json(history);
  
    } catch (error) {
      console.error("Error fetching meal request history:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
  
  // --- Admin Mess Controllers ---
  
  export const getSubscriptionRequestsForAdmin = async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'nonAcadAdmin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }
  
      const { status } = req.query;
      const filter = {};
      
      if (status && ['Pending', 'Approved', 'Rejected'].includes(status)) {
        filter.status = status;
      }
  
      const requests = await MealPlanRequest.find(filter)
        .populate({
          path: 'studentId',
          select: 'rollNo userId name',
          populate: {
            path: 'userId',
            select: 'name'
          }
        })
        .populate('processedBy', 'name')
        .sort({ createdAt: -1 })
        .lean();
  
      const enhancedRequests = requests.map(req => {
        let studentName = "N/A";
        if (req.studentId) {
          studentName = req.studentId.userId?.name || req.studentId.name || "N/A";
        }
        
        return {
          ...req,
          studentName: studentName,
          studentRollNo: req.studentId?.rollNo || req.rollNo,
          processedByName: req.processedBy?.name || null,
        };
      });
  
      res.status(200).json(enhancedRequests);
  
    } catch (error) {
      console.error("Error fetching subscription requests:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
  
  export const processSubscriptionRequest = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
      if (!req.user || req.user.role !== 'nonAcadAdmin') {
        await session.abortTransaction();
        session.endSession();
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }
  
      const { requestId } = req.params;
      const { status, rejectionReason } = req.body;
      const adminUserId = req.user._id;
  
    
      if (!requestId || !mongoose.Types.ObjectId.isValid(requestId)) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: "Invalid request ID" });
      }
  
      if (!['Approved', 'Rejected'].includes(status)) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: 'Invalid status provided. Must be Approved or Rejected.' });
      }
    
      if (status === 'Rejected' && (!rejectionReason || rejectionReason.trim() === '')) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: 'Rejection reason is required when rejecting a request.' });
      }
  
      const request = await MealPlanRequest.findById(requestId).session(session);
  
      if (!request) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: 'Meal plan request not found' });
      }
      
      if (request.status !== 'Pending') {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: `Request has already been processed with status: ${request.status} `});
      }
  
   
      request.status = status;
      request.processedAt = new Date();
      request.processedBy = adminUserId;
      if (status === 'Rejected') {
        request.rejectionReason = rejectionReason.trim();
      } else {
        request.rejectionReason = undefined;
      }
  
      if (status === 'Approved') {
        const studentObjectId = request.studentId;
        const studentRollNo = request.rollNo;
        const newPlan = request.newPlan;
  
        let subscription = await MealSubscription.findOne({ studentId: studentObjectId }).session(session);
  
        const now = new Date();
        if (!subscription) {
          
          subscription = new MealSubscription({
            studentId: studentObjectId,
            rollNo: studentRollNo,
            currentPlan: newPlan,
            startDate: now,
            isActive: true,
          });
        } else {
         
          subscription.currentPlan = newPlan;
          subscription.isActive = true;
          subscription.startDate = subscription.startDate || now;
          subscription.updatedAt = now;
        }
        await subscription.save({ session });
      }
  
      await request.save({ session });
  
      await session.commitTransaction();
  
      const updatedRequest = await MealPlanRequest.findById(request._id)
        .populate('studentId', 'name rollNo')
        .populate('processedBy', 'name')
        .lean();
  
      res.status(200).json({ 
        message: `Request ${status.toLowerCase()} successfully`, 
        request: updatedRequest 
      });
  
    } catch (error) {
  
      await session.abortTransaction();
  
      console.error("Error processing subscription request:", error);
      if (error.name === 'CastError') {
        return res.status(400).json({ message: "Invalid request ID format." });
      }
      res.status(500).json({ message: "Internal server error during request processing." });
    } finally {
    
      session.endSession();
    }
  };