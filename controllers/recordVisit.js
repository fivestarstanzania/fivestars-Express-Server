import DailyVisit from "../models/DailyVisit.js";
import moment from "moment";

export const recordVisit = async (req, res) => {
  try {
    const { userId, deviceId } = req.body;

    if (!deviceId) {
      return res.status(400).json({ message: "deviceId is required" });
    }

    const today = moment().format("YYYY-MM-DD");

    let record = await DailyVisit.findOne({ date: today });

    if (!record) {
      record = await DailyVisit.create({
        date: today,
        userIds: [],
        deviceIds: [],
        uniqueUsers: 0,
        uniqueDevices: 0
      });
    }

    let updated = false;

    // Count unique user
    if (userId && !record.userIds.includes(userId)) {
      record.userIds.push(userId);
      record.uniqueUsers += 1;
      updated = true;
    }

    // Count unique device
    if (!record.deviceIds.includes(deviceId)) {
      record.deviceIds.push(deviceId);
      record.uniqueDevices += 1;
      updated = true;
    }

    if (updated) await record.save();

    return res.status(200).json({ message: "Visit recorded" });
  } catch (err) {
    console.error("Visit error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
