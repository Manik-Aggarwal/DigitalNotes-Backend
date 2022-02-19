const express = require('express');
const router = express.Router();
const fetchuser = require('../middleware/fetchuser');
const Notes = require('../models/Notes');
const { body, validationResult } = require('express-validator');

//get all the notes, login required
router.get("/fetchallnotes", fetchuser, async (req, res) => {
    try {
        const notes = await Notes.find({user: req.user.id});
        res.json(notes);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal server error');
    }
})

//add a new note, login required
router.post("/addnote", fetchuser, [
    body('title', 'Enter a valid title').isLength({min: 3}),
    body('description', 'Enter a valid description').isLength({min: 5}),
], async (req, res) => {
    try {
        const {title, description, tag} = req.body;
        // if errors return errors
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({errors:errors.array()});
        }

        // if no errors create a new note
        const note = new Notes({
            title, description, tag, user: req.user.id
        });
        const savedNote = await note.save();
        res.json(savedNote);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal server error');
    }
})

// update an exisiting note, login required
router.put("/updatenote/:id", fetchuser, async (req, res) => {
    const {title, description, tag} = req.body;

    try {
        // create newNote object
        const newNote = {};
        if(title){newNote.title = title;}
        if(description){newNote.description = description;}
        if(tag){newNote.tag = tag;}

        //find the note to being updated
        let note = await Notes.findById(req.params.id);
        if(!note){
            return res.status(404).send("Note not found");
        }

        if(note.user.toString() !== req.user.id){
            return res.status(401).send("Not Allowed");
        }

        note = await Notes.findByIdAndUpdate(req.params.id, {$set: newNote}, {new:true});
        res.json({note});
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal server error');
    }
})

// delete an exisiting note, login required
router.delete("/deletenote/:id", fetchuser, async (req, res) => {
    try {
        //find the note to being deleted
        let note = await Notes.findById(req.params.id);
        if(!note){
            return res.status(404).send("Note not found");
        }

        if(note.user.toString() !== req.user.id){
            return res.status(401).send("Not Allowed");
        }

        note = await Notes.findByIdAndDelete(req.params.id);
        res.json({"Success": "Note deleted successfully"});
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal server error');
    }
})

module.exports = router;