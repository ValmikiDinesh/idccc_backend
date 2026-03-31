const express = require("express")
const router = express.Router()

const Member = require("../models/Member")

const generateMembershipID = require("../utils/generateMembershipID")
const generateQR = require("../utils/generateQRCode")

/*
GET ALL MEMBERS
Admin dashboard list
*/
router.get("/members", async (req, res) => {

  const members = await Member.find()

  res.json(members)

})



/*
APPROVE MEMBER
*/
router.post("/approve/:id", async (req, res) => {

  try {

    const member = await Member.findById(req.params.id)

    if (!member) {
      return res.status(404).json({ message: "Member not found" })
    }

    const count = await Member.countDocuments()

    const membershipID = generateMembershipID(count)

    const qr = await generateQR(membershipID)

    member.membershipID = membershipID
    member.qrCode = qr
    member.status = "approved"

    await member.save()

    res.json(member)

  } catch (error) {

    res.status(500).json(error)

  }

})


/*
REJECT MEMBER
*/
router.post("/reject/:id", async (req,res)=>{

  const member = await Member.findById(req.params.id)

  member.status = "rejected"

  await member.save()

  res.json(member)

})

module.exports = router