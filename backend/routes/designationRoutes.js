const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getDesignations, getDesignation, createDesignation, updateDesignation, deleteDesignation } = require('../controllers/designationController');

router.get('/', authenticate, getDesignations);
router.get('/:id', authenticate, getDesignation);
router.post('/', authenticate, authorize('admin'), createDesignation);
router.put('/:id', authenticate, authorize('admin'), updateDesignation);
router.delete('/:id', authenticate, authorize('admin'), deleteDesignation);

module.exports = router;
