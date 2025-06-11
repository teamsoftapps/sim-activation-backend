// models/Settings.js
import mongoose from "mongoose";

const SettingsSchema = new mongoose.Schema({
  activationCost: {
    type: Number,
    required: true,
  },
});

const Settings = mongoose.model("Settings", SettingsSchema);
export default Settings;
