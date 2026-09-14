const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getJobs, getJob, createJob, updateJob, deleteJob,
  getCandidates, applyCandidate, updateCandidateStatus,
  getInterviews, scheduleInterview, updateInterview
} = require('../controllers/recruitmentController');

// Job Posts
router.get('/jobs', authenticate, getJobs);
router.get('/jobs/:id', authenticate, getJob);
router.post('/jobs', authenticate, authorize('admin'), createJob);
router.put('/jobs/:id', authenticate, authorize('admin'), updateJob);
router.delete('/jobs/:id', authenticate, authorize('admin'), deleteJob);

// Candidates
router.get('/candidates', authenticate, getCandidates);
router.post('/candidates/apply', upload.single('resume'), applyCandidate);
router.put('/candidates/:id/status', authenticate, authorize('admin'), updateCandidateStatus);

// Interviews
router.get('/interviews', authenticate, getInterviews);
router.post('/interviews', authenticate, authorize('admin'), scheduleInterview);
router.put('/interviews/:id', authenticate, authorize('admin'), updateInterview);

module.exports = router;
