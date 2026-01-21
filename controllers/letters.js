const express = require("express");
const verifyToken = require("../middleware/verify-token.js");
const letter = require("../models/letter.js");
const router = express.Router();

// add routes here
// GET all letters for logged in user
router.get('/', verifyToken, async (req,res) => {
  try {
    const letters = await Letter.find({ user: req.user._id })
    .populate('user')
    .sort({createAt: -1 });
    res.json(letters);
  } catch (err) {
    res.status(500).json({err: err.message});
  }
});

// GET /letters/:id
router.get('/:id', verifyToken, async (req,res) => {
  try {
    const letter = await Letter.findById(req.params.id).populate('user');

    if (!letter) {
      return res.status(404).json({ err: 'Letter not found' });
    }
    if (!letter.user._id.equals(req.user._id)) {
      return res.status(403).json ({err: 'Unauthorized' });
    }
    res.json(letter);
    } catch (err) {
      res.status(500).json({ err: err.message });
  }
});

// POST /letters Create letter
router.post("/", verifyToken, async (req, res) => {
 try {
    req.body.user = req.user._id;
    const letter = await Letter.create(req.body);
    letter._doc.user = req.user;
    res.status(201).json(letter);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

// PUT /letters/:id  Update delivery date
router.put('/:id', verifyToken, async (req,res) => {
  try {
    const letter = await Letter.findById(req.params.id);

    if(!letter) {
      return res.status(404).json({ err: 'Letter not found' });
    }

    if (!letter.user.equals(req.user._id)) {
      return res.status(403).json ({ err: 'Unauthorized' });
    }
     const updatedLetter = await Letter.findByIdandUpdate(req.params.id,
      {deliverAt: req.body.deliverAt },
      { new: true }
     ).populate('user');

     res.json(updatedLetter);
    } catch (err) {
      res.status(500).json({ err: err.message });
    }
});

// DELETE /letters/:id 
router.delete('/:id', verifyToken, async (req,res) => {
  try {
    const letter = await Letter.findById(req.params.id);

    if(!letter) {
      return res.status(404).json({ err: 'Letter not found' });
    }

    if (!letter.user.equals(req.user._id)) {
      return res.status(403).json ({ err: 'Unauthorized' });
    }

    await Letter.findByIdandDelete(req.params.id);
    res.json({ message: 'letter deleted' });
  } catch (err) {
    res.status(500).json ({ err: err.message})
  }
});

// POST /letters/:id/reflection
router.post('/:id/reflection', verifyToken, async (req,res) => {
  try {
    const letter = await Letter.findById(req.params.id);

    if(!letter) {
      return res.status(404).json({ err: 'Letter not found' });
    }

    if (!letter.user.equals(req.user._id)) {
      return res.status(403).json ({ err: 'Unauthorized' });
    }

    letter.reflection.push(req.body);
    await letter.save();

    res.status(201).json(letter);
  } catch (err) {
    res.status(500).json ({ err: err.message });
  }
});

// DELETE /letters/:id/reflection/:reflectionid -We can remove dont remember if we said to keep or delete
router.delete('/:id/reflection/:reflectionId', verifyToken, async (req,res) => {
  try {
    const letter = await Letter.findById(req.params.id);

    if(!letter) {
      return res.status(404).json({ err: 'Letter not found' });
    }

    if (!letter.user.equals(req.user._id)) {
      return res.status(403).json ({ err: 'Unauthorized' });
    }

    letter.reflection.pull({_id: req.params.reflectionId });
    await letter.save()
    
    res.json(letter);
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
});

module.exports = router;
