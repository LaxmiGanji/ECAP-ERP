const Newspaper = require("../../models/Other/newspaper.model.js");

const FREQUENCY_TO_DAYS = {
  Daily: 1,
  Weekly: 7,
  Fortnightly: 14,
  Monthly: 30,
  Quarterly: 90,
  Yearly: 365,
  Other: 7,
};

const addDays = (date, days) => {
  const base = new Date(date);
  base.setDate(base.getDate() + days);
  return base;
};

const computeNextIssueDate = (frequency, fromDate) => {
  const days = FREQUENCY_TO_DAYS[frequency] || FREQUENCY_TO_DAYS.Other;
  return addDays(fromDate || new Date(), days);
};

const buildPayload = (body) => {
  const payload = {
    title: body.title?.trim(),
    language: body.language || "English",
    frequency: body.frequency || "Daily",
    vendor: body.vendor?.trim(),
    publisher: body.publisher?.trim(),
    copies: Number(body.copies) || 1,
    remarks: body.remarks?.trim(),
    isActive: typeof body.isActive === "boolean" ? body.isActive : true,
  };

  if (body.lastReceivedOn) {
    payload.lastReceivedOn = new Date(body.lastReceivedOn);
    payload.nextIssueDueOn = computeNextIssueDate(payload.frequency, payload.lastReceivedOn);
  }

  if (body.nextIssueDueOn) {
    payload.nextIssueDueOn = new Date(body.nextIssueDueOn);
  }

  return payload;
};

const createNewspaper = async (req, res) => {
  try {
    const payload = buildPayload(req.body);
    if (!payload.title) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }
    if (!payload.lastReceivedOn) {
      payload.lastReceivedOn = new Date();
      payload.nextIssueDueOn = computeNextIssueDate(payload.frequency, payload.lastReceivedOn);
    }
    const newspaper = await Newspaper.create(payload);
    res.json({ success: true, message: "Entry added!", newspaper });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Unable to add newspaper", error: error.message });
  }
};

const getNewspapers = async (req, res) => {
  try {
    const { search = "", status } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { title: new RegExp(search, "i") },
        { language: new RegExp(search, "i") },
        { vendor: new RegExp(search, "i") },
      ];
    }
    if (status === "active") filter.isActive = true;
    if (status === "inactive") filter.isActive = false;

    const newspapers = await Newspaper.find(filter).sort({ updatedAt: -1 });
    res.json({ success: true, newspapers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Unable to load newspapers", error: error.message });
  }
};

const updateNewspaper = async (req, res) => {
  try {
    const payload = buildPayload(req.body);
    const newspaper = await Newspaper.findByIdAndUpdate(req.params.id, payload, { new: true });
    if (!newspaper) {
      return res.status(404).json({ success: false, message: "Entry not found" });
    }
    res.json({ success: true, message: "Entry updated!", newspaper });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Unable to update entry", error: error.message });
  }
};

const deleteNewspaper = async (req, res) => {
  try {
    const newspaper = await Newspaper.findByIdAndDelete(req.params.id);
    if (!newspaper) {
      return res.status(404).json({ success: false, message: "Entry not found" });
    }
    res.json({ success: true, message: "Entry deleted!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Unable to delete entry", error: error.message });
  }
};

const markNewspaperReceived = async (req, res) => {
  try {
    const { receivedOn } = req.body;
    const newspaper = await Newspaper.findById(req.params.id);
    if (!newspaper) {
      return res.status(404).json({ success: false, message: "Entry not found" });
    }
    const date = receivedOn ? new Date(receivedOn) : new Date();
    newspaper.lastReceivedOn = date;
    newspaper.nextIssueDueOn = computeNextIssueDate(newspaper.frequency, date);
    await newspaper.save();
    res.json({ success: true, message: "Receipt recorded!", newspaper });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Unable to update receipt", error: error.message });
  }
};

module.exports = {
  createNewspaper,
  getNewspapers,
  updateNewspaper,
  deleteNewspaper,
  markNewspaperReceived,
};

