import { FinancialReport } from '../models/financialReportModel.js';
import { Ride } from '../models/rideModel.js';
import { Payment } from '../models/paymentModel.js';
import { User } from '../models/userModel.js';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export class FinancialReportController {
  // Generate a new financial report
  static async generateReport(req, res) {
    try {
      const {
        reportType,
        startDate,
        endDate,
        includeCharts = true,
        includeDetailedBreakdown = true,
        exportFormats = ['pdf', 'excel']
      } = req.body;

      const adminId = req.user.id;

      // Validate date range
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (start >= end) {
        return res.status(400).json({
          success: false,
          message: 'Start date must be before end date'
        });
      }

      // Create report record
      const report = new FinancialReport({
        reportType,
        period: { startDate: start, endDate: end },
        generatedBy: adminId,
        exportSettings: {
          formats: exportFormats.map(format => ({ type: format })),
          includeCharts,
          includeDetailedBreakdown
        },
        processingInfo: {
          startTime: new Date()
        }
      });

      await report.save();

      // Start report generation in background
      setImmediate(() => FinancialReportController.processReport(report._id));

      res.status(202).json({
        success: true,
        data: {
          reportId: report.reportId,
          status: report.status
        },
        message: 'Report generation started'
      });

    } catch (error) {
      console.error('Error generating report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate report',
        error: error.message
      });
    }
  }

  // Process report data (background task)
  static async processReport(reportObjectId) {
    try {
      const report = await FinancialReport.findById(reportObjectId);
      if (!report) return;

      const startTime = Date.now();
      const { startDate, endDate } = report.period;

      // Aggregate ride data
      const rideData = await Ride.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            status: 'completed'
          }
        },
        {
          $lookup: {
            from: 'payments',
            localField: 'paymentId',
            foreignField: '_id',
            as: 'payment'
          }
        },
        {
          $unwind: { path: '$payment', preserveNullAndEmptyArrays: true }
        },
        {
          $group: {
            _id: null,
            totalRides: { $sum: 1 },
            totalRevenue: { $sum: '$fare.actual' },
            totalCommission: { $sum: { $multiply: ['$fare.actual', 0.25] } },
            totalDriverEarnings: { $sum: { $multiply: ['$fare.actual', 0.75] } },
            paymentMethods: {
              $push: {
                method: '$payment.method',
                amount: '$fare.actual'
              }
            },
            vehicleTypes: {
              $push: {
                type: '$vehicleType',
                amount: '$fare.actual'
              }
            },
            dailyData: {
              $push: {
                date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                amount: '$fare.actual'
              }
            }
          }
        }
      ]);

      const data = rideData[0] || {
        totalRides: 0,
        totalRevenue: 0,
        totalCommission: 0,
        totalDriverEarnings: 0,
        paymentMethods: [],
        vehicleTypes: [],
        dailyData: []
      };

      // Process payment breakdown
      const paymentBreakdown = {
        cash: { amount: 0, count: 0 },
        card: { amount: 0, count: 0 },
        wallet: { amount: 0, count: 0 },
        upi: { amount: 0, count: 0 }
      };

      data.paymentMethods.forEach(payment => {
        if (payment.method && paymentBreakdown[payment.method]) {
          paymentBreakdown[payment.method].amount += payment.amount || 0;
          paymentBreakdown[payment.method].count += 1;
        }
      });

      // Process vehicle type breakdown
      const vehicleBreakdown = {};
      data.vehicleTypes.forEach(vehicle => {
        if (!vehicleBreakdown[vehicle.type]) {
          vehicleBreakdown[vehicle.type] = { revenue: 0, rideCount: 0, commission: 0 };
        }
        vehicleBreakdown[vehicle.type].revenue += vehicle.amount || 0;
        vehicleBreakdown[vehicle.type].rideCount += 1;
        vehicleBreakdown[vehicle.type].commission += (vehicle.amount || 0) * 0.25;
      });

      // Process time series data
      const timeSeriesMap = {};
      data.dailyData.forEach(item => {
        if (!timeSeriesMap[item.date]) {
          timeSeriesMap[item.date] = { date: new Date(item.date), revenue: 0, rideCount: 0 };
        }
        timeSeriesMap[item.date].revenue += item.amount || 0;
        timeSeriesMap[item.date].rideCount += 1;
        timeSeriesMap[item.date].commission = timeSeriesMap[item.date].revenue * 0.25;
        timeSeriesMap[item.date].driverEarnings = timeSeriesMap[item.date].revenue * 0.75;
      });

      // Get top drivers
      const topDrivers = await Ride.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            status: 'completed',
            driverId: { $exists: true }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'driverId',
            foreignField: '_id',
            as: 'driver'
          }
        },
        { $unwind: '$driver' },
        {
          $group: {
            _id: '$driverId',
            driverName: { $first: '$driver.name' },
            totalEarnings: { $sum: { $multiply: ['$fare.actual', 0.75] } },
            totalRides: { $sum: 1 },
            avgRating: { $avg: '$rating' }
          }
        },
        { $sort: { totalEarnings: -1 } },
        { $limit: 10 }
      ]);

      // Update report with processed data
      report.data = {
        totalRevenue: data.totalRevenue,
        totalCommission: data.totalCommission,
        totalDriverEarnings: data.totalDriverEarnings,
        totalRides: data.totalRides,
        totalRefunds: 0, // TODO: Calculate from refund data
        paymentBreakdown,
        vehicleTypeBreakdown: Object.entries(vehicleBreakdown).map(([type, data]) => ({
          vehicleType: type,
          ...data
        })),
        timeSeriesData: Object.values(timeSeriesMap),
        topDrivers: topDrivers.map(driver => ({
          driverId: driver._id,
          driverName: driver.driverName,
          totalEarnings: driver.totalEarnings,
          totalRides: driver.totalRides,
          rating: driver.avgRating || 0
        })),
        taxBreakdown: {
          gst: {
            rate: 18,
            amount: data.totalRevenue * 0.18
          },
          serviceTax: {
            rate: 0,
            amount: 0
          },
          totalTaxCollected: data.totalRevenue * 0.18
        }
      };

      report.processingInfo.recordsProcessed = data.totalRides;

      // Generate export files
      await FinancialReportController.generateExportFiles(report);

      // Mark as completed
      const processingDuration = Date.now() - startTime;
      await report.markCompleted(processingDuration);

    } catch (error) {
      console.error('Error processing report:', error);
      const report = await FinancialReport.findById(reportObjectId);
      if (report) {
        await report.markFailed(error.message);
      }
    }
  }

  // Generate export files
  static async generateExportFiles(report) {
    const exportDir = path.join(process.cwd(), 'exports', 'financial');
    
    // Ensure export directory exists
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    for (const format of report.exportSettings.formats) {
      try {
        let filePath;
        
        if (format.type === 'excel') {
          filePath = await FinancialReportController.generateExcelFile(report, exportDir);
        } else if (format.type === 'pdf') {
          filePath = await FinancialReportController.generatePDFFile(report, exportDir);
        } else if (format.type === 'csv') {
          filePath = await FinancialReportController.generateCSVFile(report, exportDir);
        }

        if (filePath && fs.existsSync(filePath)) {
          format.generated = true;
          format.filePath = filePath;
          format.fileSize = fs.statSync(filePath).size;
        }
      } catch (error) {
        console.error(`Error generating ${format.type} file:`, error);
      }
    }

    await report.save();
  }

  // Generate Excel file
  static async generateExcelFile(report, exportDir) {
    const workbook = new ExcelJS.Workbook();
    
    // Summary sheet
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.addRow(['Financial Report Summary']);
    summarySheet.addRow(['Report ID', report.reportId]);
    summarySheet.addRow(['Period', `${report.period.startDate.toDateString()} - ${report.period.endDate.toDateString()}`]);
    summarySheet.addRow(['Generated', report.createdAt.toDateString()]);
    summarySheet.addRow([]);
    summarySheet.addRow(['Metric', 'Value']);
    summarySheet.addRow(['Total Revenue', `₹${report.data.totalRevenue.toFixed(2)}`]);
    summarySheet.addRow(['Total Commission', `₹${report.data.totalCommission.toFixed(2)}`]);
    summarySheet.addRow(['Driver Earnings', `₹${report.data.totalDriverEarnings.toFixed(2)}`]);
    summarySheet.addRow(['Total Rides', report.data.totalRides]);

    // Time series sheet
    const timeSeriesSheet = workbook.addWorksheet('Daily Breakdown');
    timeSeriesSheet.addRow(['Date', 'Revenue', 'Rides', 'Commission', 'Driver Earnings']);
    report.data.timeSeriesData.forEach(item => {
      timeSeriesSheet.addRow([
        item.date.toDateString(),
        item.revenue,
        item.rideCount,
        item.commission,
        item.driverEarnings
      ]);
    });

    // Top drivers sheet
    const driversSheet = workbook.addWorksheet('Top Drivers');
    driversSheet.addRow(['Driver Name', 'Total Earnings', 'Total Rides', 'Rating']);
    report.data.topDrivers.forEach(driver => {
      driversSheet.addRow([
        driver.driverName,
        `₹${driver.totalEarnings.toFixed(2)}`,
        driver.totalRides,
        driver.rating.toFixed(1)
      ]);
    });

    const fileName = `financial_report_${report.reportId}.xlsx`;
    const filePath = path.join(exportDir, fileName);
    
    await workbook.xlsx.writeFile(filePath);
    return filePath;
  }

  // Generate PDF file
  static async generatePDFFile(report, exportDir) {
    const fileName = `financial_report_${report.reportId}.pdf`;
    const filePath = path.join(exportDir, fileName);
    
    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(filePath));

    // Header
    doc.fontSize(20).text('Financial Report', 50, 50);
    doc.fontSize(12).text(`Report ID: ${report.reportId}`, 50, 80);
    doc.text(`Period: ${report.period.startDate.toDateString()} - ${report.period.endDate.toDateString()}`, 50, 100);
    doc.text(`Generated: ${report.createdAt.toDateString()}`, 50, 120);

    // Summary section
    doc.fontSize(16).text('Summary', 50, 160);
    doc.fontSize(12).text(`Total Revenue: ₹${report.data.totalRevenue.toFixed(2)}`, 50, 190);
    doc.text(`Total Commission: ₹${report.data.totalCommission.toFixed(2)}`, 50, 210);
    doc.text(`Driver Earnings: ₹${report.data.totalDriverEarnings.toFixed(2)}`, 50, 230);
    doc.text(`Total Rides: ${report.data.totalRides}`, 50, 250);

    // Payment breakdown
    doc.fontSize(16).text('Payment Breakdown', 50, 290);
    let yPos = 320;
    Object.entries(report.data.paymentBreakdown).forEach(([method, data]) => {
      doc.fontSize(12).text(`${method.toUpperCase()}: ₹${data.amount.toFixed(2)} (${data.count} rides)`, 50, yPos);
      yPos += 20;
    });

    doc.end();
    return filePath;
  }

  // Generate CSV file
  static async generateCSVFile(report, exportDir) {
    const fileName = `financial_report_${report.reportId}.csv`;
    const filePath = path.join(exportDir, fileName);
    
    let csvContent = 'Date,Revenue,Rides,Commission,Driver Earnings\n';
    
    report.data.timeSeriesData.forEach(item => {
      csvContent += `${item.date.toISOString().split('T')[0]},${item.revenue},${item.rideCount},${item.commission},${item.driverEarnings}\n`;
    });

    fs.writeFileSync(filePath, csvContent);
    return filePath;
  }

  // Get report status
  static async getReportStatus(req, res) {
    try {
      const { reportId } = req.params;

      const report = await FinancialReport.findOne({ reportId })
        .populate('generatedBy', 'name email')
        .lean();

      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Report not found'
        });
      }

      res.json({
        success: true,
        data: {
          reportId: report.reportId,
          status: report.status,
          progress: report.status === 'completed' ? 100 : report.status === 'failed' ? 0 : 50,
          data: report.status === 'completed' ? report.data : null,
          downloadUrls: report.status === 'completed' ? report.downloadUrls : null,
          createdAt: report.createdAt,
          processingInfo: report.processingInfo
        }
      });

    } catch (error) {
      console.error('Error getting report status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get report status',
        error: error.message
      });
    }
  }

  // Download report file
  static async downloadReport(req, res) {
    try {
      const { reportId, format } = req.params;

      const report = await FinancialReport.findOne({ reportId });
      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Report not found'
        });
      }

      const formatObj = report.exportSettings.formats.find(f => f.type === format);
      if (!formatObj || !formatObj.generated || !formatObj.filePath) {
        return res.status(404).json({
          success: false,
          message: 'File not found or not generated'
        });
      }

      if (!fs.existsSync(formatObj.filePath)) {
        return res.status(404).json({
          success: false,
          message: 'File not found on disk'
        });
      }

      // Increment download count
      await report.incrementDownload(format);

      // Set appropriate headers
      const fileName = path.basename(formatObj.filePath);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      
      if (format === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf');
      } else if (format === 'excel') {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      } else if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
      }

      // Stream the file
      const fileStream = fs.createReadStream(formatObj.filePath);
      fileStream.pipe(res);

    } catch (error) {
      console.error('Error downloading report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to download report',
        error: error.message
      });
    }
  }

  // List all reports
  static async listReports(req, res) {
    try {
      const { page = 1, limit = 20, status, reportType } = req.query;

      const filter = {};
      if (status) filter.status = status;
      if (reportType) filter.reportType = reportType;

      const skip = (page - 1) * limit;

      const [reports, totalReports] = await Promise.all([
        FinancialReport.find(filter)
          .populate('generatedBy', 'name email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        FinancialReport.countDocuments(filter)
      ]);

      res.json({
        success: true,
        data: {
          reports: reports.map(report => ({
            reportId: report.reportId,
            reportType: report.reportType,
            status: report.status,
            period: report.period,
            generatedBy: report.generatedBy,
            createdAt: report.createdAt,
            downloadUrls: report.status === 'completed' ? report.downloadUrls : null
          })),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalReports,
            pages: Math.ceil(totalReports / limit)
          }
        }
      });

    } catch (error) {
      console.error('Error listing reports:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to list reports',
        error: error.message
      });
    }
  }

  // Get financial dashboard data
  static async getFinancialDashboard(req, res) {
    try {
      const { period = '30d' } = req.query;
      
      let startDate = new Date();
      if (period === '7d') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (period === '30d') {
        startDate.setDate(startDate.getDate() - 30);
      } else if (period === '90d') {
        startDate.setDate(startDate.getDate() - 90);
      }

      const endDate = new Date();

      // Get aggregated financial data
      const dashboardData = await Ride.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$fare.actual' },
            totalRides: { $sum: 1 },
            avgFare: { $avg: '$fare.actual' },
            dailyRevenue: {
              $push: {
                date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                amount: '$fare.actual'
              }
            }
          }
        }
      ]);

      const data = dashboardData[0] || {
        totalRevenue: 0,
        totalRides: 0,
        avgFare: 0,
        dailyRevenue: []
      };

      // Process daily revenue
      const revenueByDay = {};
      data.dailyRevenue.forEach(item => {
        if (!revenueByDay[item.date]) {
          revenueByDay[item.date] = 0;
        }
        revenueByDay[item.date] += item.amount;
      });

      const chartData = Object.entries(revenueByDay).map(([date, revenue]) => ({
        date,
        revenue
      })).sort((a, b) => new Date(a.date) - new Date(b.date));

      res.json({
        success: true,
        data: {
          totalRevenue: data.totalRevenue,
          totalCommission: data.totalRevenue * 0.25,
          totalDriverEarnings: data.totalRevenue * 0.75,
          totalRides: data.totalRides,
          avgFare: data.avgFare,
          chartData,
          period: {
            startDate,
            endDate
          }
        }
      });

    } catch (error) {
      console.error('Error getting financial dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get financial dashboard data',
        error: error.message
      });
    }
  }
}
