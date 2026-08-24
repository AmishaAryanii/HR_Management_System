const { Company, ActivityLog } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const path = require('path');
const fs = require('fs');

// Get company info (returns the first record, or creates a default one)
const getCompany = asyncHandler(async (req, res) => {
  let company = await Company.findOne({ order: [['id', 'ASC']] });
  if (!company) {
    company = await Company.create({ companyName: 'Debox Technology' });
  }
  res.json({ success: true, data: company });
});

// Update company info
const updateCompany = asyncHandler(async (req, res) => {
  const { companyName, address, phone, email, website, taxId, defaultCurrency, dateFormat, timezone } = req.body;

  let company = await Company.findOne({ order: [['id', 'ASC']] });
  if (!company) {
    company = await Company.create({ companyName: companyName || 'Debox Technology' });
  }

  const updateData = {};
  if (companyName !== undefined) updateData.companyName = companyName;
  if (address !== undefined) updateData.address = address;
  if (phone !== undefined) updateData.phone = phone;
  if (email !== undefined) updateData.email = email;
  if (website !== undefined) updateData.website = website;
  if (taxId !== undefined) updateData.taxId = taxId;
  if (defaultCurrency !== undefined) updateData.defaultCurrency = defaultCurrency;
  if (dateFormat !== undefined) updateData.dateFormat = dateFormat;
  if (timezone !== undefined) updateData.timezone = timezone;

  await company.update(updateData);

  // Log activity
  await ActivityLog.create({
    userId: req.user.id,
    action: 'UPDATE_COMPANY',
    resource: 'company',
    description: 'Updated company information',
    ipAddress: req.ip
  });

  res.json({ success: true, message: 'Company information updated', data: company });
});

// Upload company logo
const uploadLogo = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  let company = await Company.findOne({ order: [['id', 'ASC']] });
  if (!company) {
    company = await Company.create({ companyName: 'Debox Technology' });
  }

  // Delete old logo if exists
  if (company.logo) {
    const oldPath = path.join(__dirname, '..', company.logo);
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }
  }

  const logoPath = '/uploads/' + req.file.filename;
  await company.update({ logo: logoPath });

  res.json({ success: true, message: 'Logo uploaded successfully', data: { logo: logoPath } });
});

module.exports = { getCompany, updateCompany, uploadLogo };
