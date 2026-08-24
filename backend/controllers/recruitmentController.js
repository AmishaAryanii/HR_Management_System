const { Recruitment, Candidate, Interview, Employee, Department, Designation, ActivityLog, Notification, Sequelize } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const { Op } = Sequelize;

// === Job Posts ===
const getJobs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, departmentId } = req.query;
  const offset = (page - 1) * limit;
  const where = {};
  if (status) where.status = status;
  if (departmentId) where.departmentId = departmentId;

  const { count, rows } = await Recruitment.findAndCountAll({
    where,
    include: [
      { model: Department, as: 'department', attributes: ['id', 'name'] },
      { model: Designation, as: 'designation', attributes: ['id', 'title'] },
      { model: Employee, as: 'poster', attributes: ['id', 'firstName', 'lastName'] },
      { model: Candidate, as: 'candidates', attributes: ['id', 'status'], required: false }
    ],
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  const data = rows.map(j => ({
    ...j.toJSON(),
    candidateCount: j.candidates?.length || 0,
    hiredCount: j.candidates?.filter(c => c.status === 'hired').length || 0
  }));

  res.json({ success: true, data, pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / limit) } });
});

const getJob = asyncHandler(async (req, res) => {
  const job = await Recruitment.findByPk(req.params.id, {
    include: [{ association: 'department' }, { association: 'designation' }, { association: 'poster' }, { association: 'candidates' }]
  });
  if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
  res.json({ success: true, data: job });
});

const createJob = asyncHandler(async (req, res) => {
  const emp = await Employee.findOne({ where: { userId: req.user.id } });
  const count = await Recruitment.count();
  const jobCode = `JOB-${String(count + 1).padStart(4, '0')}`;
  const job = await Recruitment.create({ ...req.body, jobCode, postedBy: emp?.id || req.user.id, postedAt: new Date(), status: 'draft' });
  res.status(201).json({ success: true, message: 'Job created', data: job });
});

const updateJob = asyncHandler(async (req, res) => {
  const job = await Recruitment.findByPk(req.params.id);
  if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
  await job.update(req.body);
  res.json({ success: true, message: 'Job updated', data: job });
});

const deleteJob = asyncHandler(async (req, res) => {
  const job = await Recruitment.findByPk(req.params.id);
  if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
  await job.update({ status: 'cancelled' });
  res.json({ success: true, message: 'Job closed' });
});

// === Candidates ===
const getCandidates = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, recruitmentId } = req.query;
  const offset = (page - 1) * limit;
  const where = {};
  if (status) where.status = status;
  if (recruitmentId) where.recruitmentId = recruitmentId;

  const { count, rows } = await Candidate.findAndCountAll({
    where,
    include: [{ model: Recruitment, as: 'recruitment', attributes: ['id', 'jobTitle', 'jobCode'] }],
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  res.json({ success: true, data: rows, pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / limit) } });
});

const applyCandidate = asyncHandler(async (req, res) => {
  const { recruitmentId, firstName, lastName, email, phone, currentCompany, currentPosition, experienceYears, highestEducation, currentSalary, expectedSalary, skills, source, notes } = req.body;

  const existing = await Candidate.findOne({ where: { email, recruitmentId } });
  if (existing) return res.status(409).json({ success: false, message: 'Already applied for this position' });

  const candidate = await Candidate.create({
    recruitmentId, firstName, lastName, email, phone, currentCompany, currentPosition,
    experienceYears, highestEducation, currentSalary, expectedSalary, skills, source, notes,
    resume: req.file?.path
  });

  res.status(201).json({ success: true, message: 'Application submitted', data: candidate });
});

const updateCandidateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const candidate = await Candidate.findByPk(req.params.id, { include: [{ association: 'recruitment' }] });
  if (!candidate) return res.status(404).json({ success: false, message: 'Candidate not found' });
  await candidate.update({ status });
  res.json({ success: true, message: `Candidate status updated to ${status}`, data: candidate });
});

// === Interviews ===
const getInterviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, candidateId, interviewerId } = req.query;
  const offset = (page - 1) * limit;
  const where = {};
  if (status) where.status = status;
  if (candidateId) where.candidateId = candidateId;
  if (interviewerId) where.interviewerId = interviewerId;

  const { count, rows } = await Interview.findAndCountAll({
    where,
    include: [
      { model: Candidate, as: 'candidate', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: Employee, as: 'interviewer', attributes: ['id', 'firstName', 'lastName', 'employeeId'] }
    ],
    order: [['scheduledDate', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  res.json({ success: true, data: rows, pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / limit) } });
});

const scheduleInterview = asyncHandler(async (req, res) => {
  const { candidateId, interviewerId, round, type, scheduledDate, duration, location, meetingLink } = req.body;
  const interview = await Interview.create({ candidateId, interviewerId, round, type, scheduledDate, duration, location, meetingLink });
  
  // Update candidate status
  await Candidate.update({ status: 'interview_scheduled' }, { where: { id: candidateId } });

  res.status(201).json({ success: true, message: 'Interview scheduled', data: interview });
});

const updateInterview = asyncHandler(async (req, res) => {
  const interview = await Interview.findByPk(req.params.id);
  if (!interview) return res.status(404).json({ success: false, message: 'Interview not found' });
  await interview.update(req.body);
  res.json({ success: true, message: 'Interview updated', data: interview });
});

module.exports = { getJobs, getJob, createJob, updateJob, deleteJob, getCandidates, applyCandidate, updateCandidateStatus, getInterviews, scheduleInterview, updateInterview };
