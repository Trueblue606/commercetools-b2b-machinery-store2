// pages/api/downloads/[...params].js
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { params } = req.query;
  const [type, filename] = params;

  // Validate download type
  const allowedTypes = ['manuals', 'specs', 'cad', 'guides', 'safety'];
  if (!allowedTypes.includes(type)) {
    return res.status(400).json({ message: 'Invalid download type' });
  }

  // Basic security: prevent directory traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).json({ message: 'Invalid filename' });
  }

  try {
    // In production, you'd serve files from cloud storage (AWS S3, Google Cloud, etc.)
    // For demo, we'll create a download response
    
    // Track download analytics
    const downloadData = {
      type,
      filename,
      timestamp: new Date().toISOString(),
      userAgent: req.headers['user-agent'],
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
    };
    
    console.log('Download tracked:', downloadData);

    // You can store this in your database for analytics
    // await saveDownloadAnalytics(downloadData);

    // For demo purposes, return a text file
    // In production, you'd stream the actual file
    const demoContent = generateDemoFile(type, filename);
    
    // Set appropriate headers
    res.setHeader('Content-Type', getContentType(filename));
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'private, no-cache');
    
    // In production, you'd stream the file:
    // const fileStream = getFileFromStorage(type, filename);
    // fileStream.pipe(res);
    
    res.status(200).send(demoContent);
    
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ message: 'Download failed' });
  }
}

function generateDemoFile(type, filename) {
  const templates = {
    manuals: `PRODUCT MANUAL
    
Installation and Operation Guide

Table of Contents:
1. Safety Instructions
2. Installation Requirements
3. Assembly Instructions
4. Operation Manual
5. Maintenance Schedule
6. Troubleshooting
7. Technical Support

This is a demo file for ${filename}. 
In production, this would be the actual PDF manual.

Generated on: ${new Date().toISOString()}`,

    specs: `TECHNICAL SPECIFICATIONS

Product Specifications:
- Model: ${filename.replace('.pdf', '')}
- Dimensions: 1200mm x 800mm x 600mm
- Weight: 45kg
- Power Requirements: 230V AC, 50Hz
- Operating Temperature: -10°C to +60°C
- Material: Stainless Steel 316L
- Certifications: CE, ISO 9001

Performance Data:
- Maximum Flow Rate: 1000 L/min
- Working Pressure: 10 bar
- Efficiency: >95%

This is a demo specifications file.
Generated on: ${new Date().toISOString()}`,

    cad: `AutoCAD Drawing File (Demo)
    
File: ${filename}
Type: 3D Model
Units: Millimeters
Origin: 0,0,0

Layer Information:
- Dimensions
- Construction Lines
- Parts
- Assembly

This would be a binary CAD file in production.
Generated on: ${new Date().toISOString()}`,

    guides: `INSTALLATION GUIDE

Step-by-Step Installation Instructions

Required Tools:
- Wrench set (10-22mm)
- Torque wrench
- Level
- Measuring tape

Installation Steps:
1. Prepare the installation area
2. Check all components
3. Position the unit
4. Connect utilities
5. Test operation

This is a demo installation guide.
Generated on: ${new Date().toISOString()}`,

    safety: `SAFETY DATA SHEET

Product: ${filename.replace('-sds.pdf', '')}
Revision Date: ${new Date().toISOString()}

SECTION 1: IDENTIFICATION
Product Name: Industrial Equipment Component
Manufacturer: Your Company Ltd.

SECTION 2: HAZARD IDENTIFICATION
Classification: Not classified as hazardous

SECTION 3: COMPOSITION
Material: Stainless Steel, Non-hazardous

This is a demo safety data sheet.
Generated on: ${new Date().toISOString()}`
  };

  return templates[type] || `Demo file: ${filename}\nGenerated on: ${new Date().toISOString()}`;
}

function getContentType(filename) {
  const extension = filename.split('.').pop().toLowerCase();
  const contentTypes = {
    'pdf': 'application/pdf',
    'dwg': 'application/acad',
    'dxf': 'application/dxf',
    'step': 'application/step',
    'iges': 'application/iges',
    'txt': 'text/plain',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  };
  
  return contentTypes[extension] || 'application/octet-stream';
}