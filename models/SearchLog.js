import { Schema, model } from 'mongoose';
const SearchLogSchema = new Schema(
  {
    keyword: { type: String, required: true, trim: true },
  resultsFound: { type: Number, required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  createdAt: { type: Date, default: Date.now },
  }
);

export default model("SearchLog", SearchLogSchema);