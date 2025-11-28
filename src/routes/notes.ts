import express from 'express';
import { Note } from '../models/Note';
import { ApiResponse, CreateNoteData, UpdateNoteData } from '../types';

const router = express.Router();

// Create a new note
router.post('/', async (req: express.Request<{}, {}, CreateNoteData>, res: express.Response<ApiResponse<any>>): Promise<void> => {
  try {
    const { title, description, notificationDate } = req.body;

    // Validate required fields
    if (!title || !description) {
      res.status(400).json({
        success: false,
        message: 'Title and description are required'
      });
      return;
    }

    const noteData: any = {
      title,
      description
    };

    // Add notification date if provided
    if (notificationDate) {
      const notifDate = new Date(notificationDate);
      
      // Validate it's a valid date
      if (isNaN(notifDate.getTime())) {
        res.status(400).json({
          success: false,
          message: 'Invalid notification date format'
        });
        return;
      }
      
      noteData.notificationDate = notifDate;
      
      // Validate notification datetime is in the future
      if (notifDate <= new Date()) {
        res.status(400).json({
          success: false,
          message: 'Notification date must be in the future'
        });
        return;
      }
    }

    const note = new Note(noteData);
    await note.save();

    res.status(201).json({
      success: true,
      data: note
    });
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating note',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all notes
router.get('/', async (req: express.Request, res: express.Response<ApiResponse<any>>): Promise<void> => {
  try {
    const notes = await Note.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: notes,
      count: notes.length
    });
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notes',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get note by ID
router.get('/:id', async (req: express.Request<{ id: string }>, res: express.Response<ApiResponse<any>>): Promise<void> => {
  try {
    const note = await Note.findById(req.params.id);
    
    if (!note) {
      res.status(404).json({
        success: false,
        message: 'Note not found'
      });
      return;
    }

    res.json({
      success: true,
      data: note
    });
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching note',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update a note
router.put('/:id', async (req: express.Request<{ id: string }, {}, UpdateNoteData>, res: express.Response<ApiResponse<any>>): Promise<void> => {
  try {
    const { title, description, notificationDate } = req.body;
    
    const updateData: any = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    
    if (notificationDate) {
      const notifDate = new Date(notificationDate);
      
      // Validate it's a valid date
      if (isNaN(notifDate.getTime())) {
        res.status(400).json({
          success: false,
          message: 'Invalid notification date format'
        });
        return;
      }
      
      updateData.notificationDate = notifDate;
      updateData.isNotified = false; // Reset notification status when date changes
      
      // Validate notification datetime is in the future
      if (notifDate <= new Date()) {
        res.status(400).json({
          success: false,
          message: 'Notification date must be in the future'
        });
        return;
      }
    }

    const note = await Note.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!note) {
      res.status(404).json({
        success: false,
        message: 'Note not found'
      });
      return;
    }

    res.json({
      success: true,
      data: note
    });
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating note',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete a note
router.delete('/:id', async (req: express.Request<{ id: string }>, res: express.Response<ApiResponse<null>>): Promise<void> => {
  try {
    const note = await Note.findByIdAndDelete(req.params.id);
    
    if (!note) {
      res.status(404).json({
        success: false,
        message: 'Note not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting note',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;