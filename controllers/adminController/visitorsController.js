// controllers/visitorsController.js
import DailyVisit from "../../models/DailyVisit.js";
import moment from "moment";

export const getVisitorStats = async (req, res) => {
  try {
    const today = moment().format("YYYY-MM-DD");
    const yesterday = moment().subtract(1, "day").format("YYYY-MM-DD");

    // Get today's and yesterday's visits
    const [todayVisit, yesterdayVisit] = await Promise.all([
      DailyVisit.findOne({ date: today }),
      DailyVisit.findOne({ date: yesterday }),
    ]);

    const visitorsToday = todayVisit ? todayVisit.uniqueDevices : 0;
    const visitorsYesterday = yesterdayVisit ? yesterdayVisit.uniqueDevices : 0;

    // Calculate percentage change
    let change = 0;
    let changeType = "same";
    
    if (visitorsYesterday > 0) {
      change = ((visitorsToday - visitorsYesterday) / visitorsYesterday) * 100;
    } else if (visitorsToday > 0) {
      change = 100;
    }
    
    if (change > 0) changeType = "increase";
    else if (change < 0) changeType = "decrease";

    res.json({
      visitorsToday,
      visitorsYesterday,
      change: Math.abs(change).toFixed(1),
      changeType,
    });
  } catch (error) {
    console.error("Visitor stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getVisitorsTrend = async (req, res) => {
  try {
    const { period = "7days" } = req.query;
    let startDate;

    switch (period) {
      case "7days":
        startDate = moment().subtract(7, "days").format("YYYY-MM-DD");
        break;
      case "30days":
        startDate = moment().subtract(30, "days").format("YYYY-MM-DD");
        break;
      default:
        startDate = moment().subtract(7, "days").format("YYYY-MM-DD");
    }

    const visits = await DailyVisit.find({
      date: { $gte: startDate },
    }).sort({ date: 1 });

    // Format the data for chart
    const data = visits.map((visit) => ({
      date: visit.date,
      visitors: visit.uniqueDevices,
      uniqueUsers: visit.uniqueUsers,
    }));

    // Fill in missing dates with 0
    const allDates = [];
    const currentDate = moment(startDate);
    const endDate = moment();

    while (currentDate <= endDate) {
      allDates.push(currentDate.format("YYYY-MM-DD"));
      currentDate.add(1, "day");
    }

    const completeData = allDates.map((date) => {
      const existing = visits.find((v) => v.date === date);
      return {
        date,
        visitors: existing ? existing.uniqueDevices : 0,
        uniqueUsers: existing ? existing.uniqueUsers : 0,
      };
    });

    res.json({
      success: true,
      data: completeData,
    });
  } catch (error) {
    console.error("Visitors trend error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching visitors data",
    });
  }
};