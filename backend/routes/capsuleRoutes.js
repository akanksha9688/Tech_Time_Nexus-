const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware'); // Assuming you have this middleware set up
const db = require('../models/Capsule');
const {
  createCapsule,
  getMyCapsules,
  simulateTriggers,
  checkInLocation,
  simulatePRMilestone
} = require('../controllers/capsuleController');

// Defensive fallback for missing handlers
function notImplemented(req, res) {
  res.status(501).json({ error: 'Not implemented' });
}

// Use fallback if any handler is not a function
router.post('/create', auth, typeof createCapsule === 'function' ? createCapsule : notImplemented);
router.get('/mine', auth, typeof getMyCapsules === 'function' ? getMyCapsules : notImplemented);
router.post('/simulate', typeof simulateTriggers === 'function' ? simulateTriggers : notImplemented);
router.post('/checkin', auth, typeof checkInLocation === 'function' ? checkInLocation : notImplemented);
router.post('/simulate/pr', typeof simulatePRMilestone === 'function' ? simulatePRMilestone : notImplemented);

// Add a DELETE route for deleting a capsule by ID
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  console.log('DELETE request received for capsule ID:', id);
  const query = 'DELETE FROM capsules WHERE id = ?';

  db.run(query, [id], function (err) {
    if (err) {
      console.error('Error deleting capsule:', err);
      return res.status(500).json({ error: 'Failed to delete capsule.' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Capsule not found.' });
    }

    res.json({ message: 'Capsule deleted successfully.' });
  });
});

module.exports = router;
