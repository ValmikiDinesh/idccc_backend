import express from "express";
import upload from "../middleware/upload.js";
import Member from "../models/Member.js";
import { v2 as cloudinary } from 'cloudinary';
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"; // Run: npm install jsonwebtoken
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';
import QRCode from 'qrcode';

// Import Modular Utilities
import { generateRegId } from '../utils/generateId.js';
import { generateCertHtml } from '../utils/certificateTemplate.js';
import { generateIdCardHtml } from '../utils/idCardTemplate.js';

const router = express.Router();

// --- 1. SETUP & UTILS ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cloudinary Config (Moved to top-level for consistency)
const configureCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
};

// Updated function to read your local assets
function getBase64(file) {
    // This assumes your 'assets' folder is in the root of 'backend'
    // Adjust the path '../assets' if your folder is named differently
    const filePath = path.join(__dirname, '../assets', file);
    
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        return ""; // Return empty string so the code doesn't crash
    }
    
    const bitmap = fs.readFileSync(filePath);
    return `data:image/png;base64,${Buffer.from(bitmap).toString('base64')}`;
}

// Helper for Cloudinary Stream Upload
const streamUpload = (buffer, folder, publicId = null) => {
  return new Promise((resolve, reject) => {
    const options = { folder };
    if (publicId) {
      options.public_id = publicId;
      options.overwrite = true;
    }
    const stream = cloudinary.uploader.upload_stream(options, (err, res) => {
      res ? resolve(res.secure_url) : reject(err);
    });
    stream.end(buffer);
  });
};

// 1. Get your Frontend URL from Environment Variables
// On Render, you will set FRONTEND_URL = "https://idccc-member.vercel.app"
const frontendBaseUrl = process.env.FRONTEND_URL;

// --- AUTH & PUBLIC ROUTES ---

/**
 * ✅ 1. REGISTER (Step 1: Data & Images)
 * Only uploads to Cloudinary if validation passes.
 */
router.post("/register", upload.fields([
  { name: "aadhaarFrontImage", maxCount: 1 },
  { name: "aadhaarBackImage", maxCount: 1 },
  { name: "profilePhoto", maxCount: 1 }
]), async (req, res) => {

  try {
    configureCloudinary();
    const { fullName, email, mobile, aadhaarNumber } = req.body;

    if (!fullName || !email || !mobile || !aadhaarNumber) {
      return res.status(400).json({ error: "Missing mandatory fields." });
    }

    const existing = await Member.findOne({ $or: [{ email }, { mobile }, { aadhaarNumber }] });
    if (existing) return res.status(400).json({ error: "Member with this Email/Mobile/Aadhaar already exists." });

    if (!req.files?.aadhaarFrontImage || !req.files?.aadhaarBackImage || !req.files?.profilePhoto) {
      return res.status(400).json({ error: "Required images are missing." });
    }

    const [frontUrl, backUrl, profileUrl] = await Promise.all([
      streamUpload(req.files.aadhaarFrontImage[0].buffer, "idccc_kyc"),
      req.files.aadhaarBackImage ? streamUpload(req.files.aadhaarBackImage[0].buffer, "idccc_kyc") : Promise.resolve(""),
      streamUpload(req.files.profilePhoto[0].buffer, "idccc_profiles")
    ]);

    const newMember = new Member({
      ...req.body,
      aadhaarFrontImage: frontUrl,
      aadhaarBackImage: backUrl,
      profilePhoto: profileUrl,
    });

    await newMember.save();
    res.status(201).json({ success: true, memberId: newMember._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * ✅ 2. SET PASSWORD (Step 2: Finish Registration)
 */
router.put("/set-password/:id", async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) return res.status(400).json({ error: "Password must be 6+ chars." });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await Member.findByIdAndUpdate(req.params.id, { password: hashedPassword });
    res.json({ success: true, message: "Password set successfully." });
  } catch (err) {
    res.status(500).json({ error: "Error securing account." });
  }
});

/**
 * ✅ 3. LOGIN
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await Member.findOne({ email });

    if (!user || !user.password) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid email or password." });

    // Generate JWT Token (Expires in 24h)
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '24h' });

    res.json({
      success: true,
      token,
      user: { id: user._id, fullName: user.fullName, status: user.status }
    });
  } catch (err) {
    res.status(500).json({ error: "Login failed." });
  }
});

/**
 * ✅ 4. FORGOT PASSWORD (Verify Email & Send OTP)
 */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await Member.findOne({ email });

    if (!user) return res.status(404).json({ error: "No account with this email exists." });

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 Hour
    await user.save();

    // NOTE: Integrate Nodemailer here to send 'otp' to user.email
    console.log(`OTP for ${email}: ${otp}`); 

    res.json({ success: true, message: "OTP sent to your email." });
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
});

/**
 * ✅ 5. RESET PASSWORD (Verify OTP & Update)
 */
router.put("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await Member.findOne({ 
      email, 
      resetPasswordOTP: otp, 
      resetPasswordExpires: { $gt: Date.now() } 
    });

    if (!user) return res.status(400).json({ error: "Invalid or expired OTP." });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordOTP = null; // Clear OTP
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ success: true, message: "Password updated successfully." });
  } catch (err) {
    res.status(500).json({ error: "Reset failed." });
  }
});


// GET member by ID - Selective Fetching
router.get("/:id", async (req, res) => {
  try {
    const member = await Member.findById(req.params.id).select(
      "profilePhoto fullName gender dob mobile email address city district pincode creatorType isActive membershipPlan parentName paymentStatus purpose state status regNumber certificateUrl idCardUrl"
    );

    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    res.json(member);
  } catch (err) {
    res.status(500).json({ error: "Server error while fetching member data" });
  }
});

// ✅ UPDATE PAYMENT STATUS
router.put("/pay/:id", async (req, res) => {
  try {
    const member = await Member.findByIdAndUpdate(
      req.params.id, 
      { paymentStatus: "paid" }, 
      { new: true }
    );
    res.json(member);
  } catch (err) {
    res.status(500).json({ error: "Payment update failed" });
  }
});


router.post("/generate-docs/:id", async (req, res) => {
  configureCloudinary();
  let browser;
  const startTime = Date.now();
  
  try {
    console.log(`\n--- 🚀 STARTING GENERATION [ID: ${req.params.id}] ---`);
    
    // 1. Database Check
    const member = await Member.findById(req.params.id);
    if (!member) {
      console.error("❌ Error: Member not found in Database");
      return res.status(404).json({ error: "Member not found" });
    }
    console.log("✅ Step 1: Member Data Loaded:", member.fullName);

    // 2. Registration ID Logic
    if (!member.regNumber) {
      member.regNumber = generateRegId(); // Assuming this helper is defined in your file
      await member.save();
      console.log("✅ Step 2: New RegNumber Assigned:", member.regNumber);
    } else {
      console.log("✅ Step 2: Using Existing RegNumber:", member.regNumber);
    }

    // 3. Local Asset Loading
    console.log("⏳ Step 3: Converting Local Assets to Base64...");
    const assets = {
      logoBase64: getBase64('idccc-logo.png'),
      sealBase64: getBase64('complex-seal.png'),
      sigRegistrar: getBase64('Somasekhar.png'),
      sigDinesh: getBase64('Dinesh.png')
    };
    console.log("✅ Step 3: Assets Loaded (Base64 check):", !!assets.logoBase64);

    // 4. QR Code Generation
    // FRONTEND_URL should be set in Render env variables (e.g., https://your-site.vercel.app)
    const frontendBaseUrl = process.env.FRONTEND_URL;
    const verificationUrl = `${frontendBaseUrl}/verify/${member._id}`;

    console.log("⏳ Step 4: Generating QR Code for:", verificationUrl);
    const qrCodeBase64 = await QRCode.toDataURL(verificationUrl, {
        errorCorrectionLevel: 'H',
        margin: 1,
        color: {
            dark: '#1e3a8a', 
            light: '#ffffff'
        }
    });
    
    // Inject QR code into assets so it's accessible by generateIdCardHtml
    assets.qrCodeBase64 = qrCodeBase64;
    console.log("✅ Step 4: QR Code injected into assets.");


  
    // 5. Puppeteer Launch
console.log("⏳ Step 5: Launching Chromium Browser...");

// This helper finds the chrome executable inside your local project cache
const getExecutablePath = () => {
    const cachePath = path.join(process.cwd(), '.cache', 'puppeteer', 'chrome');
    if (fs.existsSync(cachePath)) {
        // Recursively find the 'chrome' binary file
        const findChrome = (dir) => {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const fullPath = path.join(dir, file);
                if (fs.lstatSync(fullPath).isDirectory()) {
                    const found = findChrome(fullPath);
                    if (found) return found;
                } else if (file === 'chrome' || file === 'chrome.exe') {
                    return fullPath;
                }
            }
        };
        return findChrome(cachePath);
    }
    return null;
};

const exePath = getExecutablePath();
console.log("📍 Detected Chrome Path:", exePath);

try {
  browser = await puppeteer.launch({ 
    headless: "new", 
    executablePath: exePath, // Use the local path we just found
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--single-process'
    ] 
  });
  console.log("✅ Step 5: Browser Launched successfully.");
} catch (error) {
  console.error("❌ Final Launch Attempt Failed:", error.message);
  throw error;
}

    const [pageCert, pageId] = await Promise.all([browser.newPage(), browser.newPage()]);
    
    // Set Viewports (A4 for Cert, Custom for ID)
    await pageCert.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
    await pageId.setViewport({ width: 400, height: 600, deviceScaleFactor: 2 });
    console.log("✅ Step 6: Tabs Opened & Viewports Set.");

    // 6. Injecting HTML Content
    console.log("⏳ Step 7: Injecting HTML Content into Pages...");
    await Promise.all([
      pageCert.setContent(generateCertHtml(member, assets)),
      pageId.setContent(generateIdCardHtml(member, assets))
    ]);
    console.log("✅ Step 7: HTML Content Injected.");

    // 7. Network Idle
    console.log("⏳ Step 8: Waiting for External Resources...");
    await Promise.all([
      pageCert.waitForNetworkIdle({ timeout: 30000 }).catch(e => console.warn("⚠️ Cert Page: Network timeout.")),
      pageId.waitForNetworkIdle({ timeout: 30000 }).catch(e => console.warn("⚠️ ID Page: Network timeout."))
    ]);
    console.log("✅ Step 8: Network check finished.");

    // 8. Screenshots
    console.log("⏳ Step 9: Capturing Screenshots (PNG Buffers)...");
    const [certBuf, idBuf] = await Promise.all([
      pageCert.screenshot({ type: 'png', fullPage: true }),
      pageId.screenshot({ type: 'png', fullPage: true })
    ]);
    console.log("✅ Step 9: Screenshots Captured.");

    // 9. Cloudinary Upload
    console.log("⏳ Step 10: Uploading Buffers to Cloudinary...");
    const [certUrl, idCardUrl] = await Promise.all([
      streamUpload(certBuf, "idccc_certificates", `cert_${member._id}`),
      streamUpload(idBuf, "idccc_idcards", `id_${member._id}`)
    ]);
    console.log("✅ Step 10: Cloudinary Upload Complete.");

    // 10. Database Update
    member.certificateUrl = certUrl;
    member.idCardUrl = idCardUrl;
    await member.save();
    console.log("✅ Step 11: Database Updated with Asset URLs.");

    await browser.close();
    const duration = (Date.now() - startTime) / 1000;
    console.log(`\n--- ✨ SUCCESS: DOCUMENTS GENERATED IN ${duration}s ---\n`);
    
    res.json({ success: true, certUrl, idCardUrl, regNumber: member.regNumber });

  } catch (err) {
    if (browser) await browser.close();
    console.error("\n❌ --- ERROR DURING GENERATION ---");
    console.error(err);
    res.status(500).json({ error: "Generation failed", details: err.message });
  }
});

// --- ADMIN ROUTES ---

router.get("/members", async (req, res) => {
  try {
    const members = await Member.find().sort({ createdAt: -1 });
    res.json(members);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put("/status/:id", async (req, res) => {
  try {
    const member = await Member.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.json(member);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put("/activate/:id", async (req, res) => {
  try {
    const count = await Member.countDocuments({ isActive: true });
    const membershipId = `IDCCC${new Date().getFullYear()}${1001 + count}`;
    const member = await Member.findByIdAndUpdate(req.params.id, { isActive: true, membershipId, status: "approved" }, { new: true });
    res.json(member);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/:id", async (req, res) => {
  try {
    const member = await Member.findById(req.params.id).select("-password");
    res.json(member);
  } catch (err) { res.status(500).json({ error: "Fetch error" }); }
});

router.put("/pay/:id", async (req, res) => {
  try {
    const member = await Member.findByIdAndUpdate(req.params.id, { paymentStatus: "paid" }, { new: true });
    res.json(member);
  } catch (err) { res.status(500).json({ error: "Update failed" }); }
});

export default router;




router.get("/render-id/:id", async (req, res) => {
    try {
        // 1. Fetch Real Member from DB
        const member = await Member.findById(req.params.id);
        if (!member) return res.status(404).send("Member not found in MongoDB");

        // 2. Load Real Assets from your 'assets' folder
        const getBase64 = (fileName) => {
            try {
                const filePath = path.join(process.cwd(), 'assets', fileName);
                const bitmap = fs.readFileSync(filePath);
                return `data:image/png;base64,${bitmap.toString('base64')}`;
            } catch (e) {
                console.error(`Missing asset: ${fileName}`);
                return "";
            }
        };

        const assets = {
            logoBase64: getBase64('idccc-logo.png'),
            sealBase64: getBase64('complex-seal.png'),
            sigRegistrar: getBase64('Somasekhar.png'),
            sigDinesh: getBase64('Dinesh.png')
        };

        // 3. Generate the HTML using your template
        const html = generateIdCardHtml(member, assets);

        // 4. Send as HTML to the browser
        res.setHeader('Content-Type', 'text/html');
        res.send(html);

    } catch (err) {
        console.error(err);
        res.status(500).send("Error rendering template: " + err.message);
    }
});


