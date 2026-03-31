import mongoose from "mongoose";

const memberSchema = new mongoose.Schema({
  // Personal
  fullName: {
    type: String,
    required: [true, "Full name is required"],
    trim: true
  },
  parentName: {
    type: String,
    required: [true, "Parent/Guardian name is required"],
    trim: true
  },
  dob: {
    type: Date,
    required: [true, "Date of birth is required"]
  },
  gender: {
    type: String,
    required: [true, "Gender is required"],
    enum: ["Male", "Female", "Other"]
  },
  mobile: {
    type: String,
    required: [true, "Mobile number is required"],
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true
  },

  // --- NEW SECURITY FIELDS ---
  password: {
    type: String,
    // Not required initially because password is set after image upload
    required: false 
  },
  resetPasswordOTP: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  // ---------------------------

  // Address
  address: {
    type: String,
    required: [true, "Address is required"],
    trim: true
  },
  city: {
    type: String,
    required: [true, "City is required"],
    trim: true
  },
  district: {
    type: String,
    required: [true, "District is required"],
    trim: true
  },
  state: {
    type: String,
    required: [true, "State is required"],
    trim: true
  },
  pincode: {
    type: String,
    required: [true, "Pincode is required"],
    trim: true
  },

  // Aadhaar & Photos
  aadhaarNumber: {
    type: String,
    required: [true, "Aadhaar number is required"],
    unique: true,
    trim: true
  },
  aadhaarFrontImage: {
    type: String,
    required: [true, "Aadhaar front image is required"]
  },
  aadhaarBackImage: {
    type: String,
    required: [true, "Aadhaar back image is required"]
  },
  profilePhoto: {
    type: String,
    required: [true, "Profile photo is required"]
  },

  // Creator Details
  creatorType: {
    type: String,
    required: [true, "Creator type is required"]
  },
  channelName: String,
  youtube: String,
  instagram: String,
  facebook: String,
  x: String,
  website: String,
  experience: String,

  // Membership
  membershipPlan: {
    type: String,
    required: [true, "Membership plan is required"]
  },
  purpose: {
    type: String,
    required: [true, "Purpose of joining is required"],
    trim: true
  },

  // System Fields
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },
  paymentStatus: {
    type: String,
    enum: ["unpaid", "paid"],
    default: "unpaid"
  },
  isActive: {
    type: Boolean,
    default: false
  },
  regNumber: { 
        type: String, 
        unique: true, // Prevents two people from having the same ID
        sparse: true  // Allows the field to be empty until generated
    },
    certificateUrl: String,
    idCardUrl: String,
    
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Member", memberSchema);