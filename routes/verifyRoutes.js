const express = require("express")
const router = express.Router()

const Member = require("../models/Member")

router.get("/:id", async(req,res)=>{

const member = await Member.findOne({
membershipID:req.params.id
})

if(!member){

return res.json({
valid:false
})

}

res.json({
valid:true,
member
})

})

module.exports = router