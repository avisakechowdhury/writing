import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate as auth } from '../middleware/auth.js';
import Report from '../models/Report.js';

const router = express.Router();

// Submit a report
router.post('/submit', auth, [
  body('reportedItemType').isIn(['post', 'comment', 'chat_message', 'user']),
  body('reportedItemId').notEmpty(),
  body('reason').isIn([
    'spam',
    'inappropriate_content',
    'harassment',
    'hate_speech',
    'violence',
    'misinformation',
    'copyright_violation',
    'other'
  ]),
  body('description').isLength({ min: 10, max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { reportedItemType, reportedItemId, reason, description } = req.body;
    const reporterId = req.user.id;

    // Check if user has already reported this item
    const existingReport = await Report.findOne({
      reporterId,
      reportedItemType,
      reportedItemId
    });

    if (existingReport) {
      return res.status(400).json({ 
        message: 'You have already reported this item' 
      });
    }

    // Create new report
    const report = new Report({
      reporterId,
      reportedItemType,
      reportedItemId,
      reason,
      description
    });

    await report.save();

    res.json({ 
      message: 'Report submitted successfully',
      reportId: report._id 
    });

  } catch (error) {
    console.error('Submit report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's reports
router.get('/my-reports', auth, async (req, res) => {
  try {
    const reporterId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reports = await Report.find({ reporterId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Report.countDocuments({ reporterId });

    res.json({
      reports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get user reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get report details (for the reporter)
router.get('/:reportId', auth, async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.user.id;

    const report = await Report.findOne({
      _id: reportId,
      reporterId: userId
    });

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json(report);

  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update report (for the reporter)
router.put('/:reportId', auth, [
  body('description').optional().isLength({ min: 10, max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { reportId } = req.params;
    const userId = req.user.id;
    const { description } = req.body;

    const report = await Report.findOne({
      _id: reportId,
      reporterId: userId,
      status: 'pending' // Only allow updates to pending reports
    });

    if (!report) {
      return res.status(404).json({ message: 'Report not found or cannot be updated' });
    }

    if (description) {
      report.description = description;
    }

    await report.save();

    res.json({ 
      message: 'Report updated successfully',
      report 
    });

  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete report (for the reporter, only if pending)
router.delete('/:reportId', auth, async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.user.id;

    const report = await Report.findOneAndDelete({
      _id: reportId,
      reporterId: userId,
      status: 'pending' // Only allow deletion of pending reports
    });

    if (!report) {
      return res.status(404).json({ message: 'Report not found or cannot be deleted' });
    }

    res.json({ message: 'Report deleted successfully' });

  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
