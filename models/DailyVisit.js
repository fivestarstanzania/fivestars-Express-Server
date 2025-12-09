import mongoose from "mongoose";

const DailyVisitSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true },
  uniqueUsers: { type: Number, default: 0 },
  uniqueDevices: { type: Number, default: 0 },
  userIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  deviceIds: [{ type: String }]
});

export default mongoose.model("DailyVisit", DailyVisitSchema);
